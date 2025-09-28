#!/usr/bin/env -S deno run --allow-all

/**
 * Core AST Scanner - Extracts TypeScript/JavaScript code structure into Kuzu
 * This is the heart of the semantic analysis system
 */

import { Project, Node, Type, Symbol, SourceFile, SyntaxKind } from "npm:ts-morph@22.0.0";
import { walk } from "@std/fs";
import { relative, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { green, yellow, red, bold, dim } from "@std/fmt/colors";
import { parse } from "@std/flags";

const KUZU_DB_PATH = Deno.env.get("KUZU_DB_PATH") || ".kuzu/semantic.db";
const DUCKDB_PATH = Deno.env.get("DUCKDB_PATH") || ".duckdb/metrics.db";

interface ScanOptions {
  path: string;
  incremental: boolean;
  verbose: boolean;
  include?: string[];
  exclude?: string[];
  maxDepth?: number;
}

interface ExtractedSymbol {
  id: string;
  name: string;
  kind: string;
  filePath: string;
  line: number;
  column: number;
  isExported: boolean;
  isAsync: boolean;
  visibility: string;
  jsdoc: string;
}

interface ExtractedType {
  id: string;
  name: string;
  kind: string;
  definition: string;
  isGeneric: boolean;
  typeParams: string[];
  filePath: string;
  line: number;
}

interface ExtractedImport {
  id: string;
  sourceFile: string;
  importedPath: string;
  specifiers: string[];
  isTypeOnly: boolean;
  isDefault: boolean;
  isNamespace: boolean;
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  metadata?: Record<string, unknown>;
}

class ASTScanner {
  private project: Project;
  private symbols: Map<string, ExtractedSymbol> = new Map();
  private types: Map<string, ExtractedType> = new Map();
  private imports: Map<string, ExtractedImport> = new Map();
  private relationships: Relationship[] = [];
  private fileHashes: Map<string, string> = new Map();

  constructor(private options: ScanOptions) {
    // Check if tsconfig.json exists in the target path
    const tsconfigPath = join(options.path, "tsconfig.json");
    let tsconfigExists = false;

    try {
      tsconfigExists = Deno.statSync(tsconfigPath).isFile;
    } catch {
      // tsconfig.json doesn't exist, will use default compiler options
    }

    this.project = new Project({
      tsConfigFilePath: tsconfigExists ? tsconfigPath : undefined,
      compilerOptions: !tsconfigExists ? {
        target: 22, // ES2022
        module: 199, // NodeNext
        lib: ["es2022"],
        allowJs: true,
        checkJs: false,
        strict: true,
      } : undefined,
      skipAddingFilesFromTsConfig: true,
    });
  }

  async scan(): Promise<void> {
    console.log(bold("\n🔍 Scanning codebase for TypeScript/JavaScript files..."));

    // Add source files
    const files = await this.findSourceFiles();
    console.log(`Found ${green(files.length.toString())} files to analyze`);

    // Process each file
    let processed = 0;
    for (const file of files) {
      await this.processFile(file);
      processed++;
      if (processed % 10 === 0) {
        console.log(dim(`  Processed ${processed}/${files.length} files...`));
      }
    }

    console.log(green(`✓ Analyzed ${processed} files`));
    console.log(`  Symbols: ${this.symbols.size}`);
    console.log(`  Types: ${this.types.size}`);
    console.log(`  Imports: ${this.imports.size}`);
    console.log(`  Relationships: ${this.relationships.length}`);

    // Store in Kuzu
    await this.storeInKuzu();

    // Calculate metrics and store in DuckDB
    await this.storeMetricsInDuckDB();
  }

  private async findSourceFiles(): Promise<SourceFile[]> {
    const sourceFiles: SourceFile[] = [];
    const extensions = [".ts", ".tsx", ".js", ".jsx"];

    for await (const entry of walk(this.options.path, {
      maxDepth: this.options.maxDepth || 10,
      includeDirs: false,
      exts: extensions,
      skip: [
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /coverage/,
        /\.cache/,
      ],
    })) {
      const relativePath = relative(this.options.path, entry.path);

      // Check include/exclude patterns
      if (this.options.exclude?.some(pattern => relativePath.includes(pattern))) {
        continue;
      }
      if (this.options.include && !this.options.include.some(pattern => relativePath.includes(pattern))) {
        continue;
      }

      const sourceFile = this.project.addSourceFileAtPath(entry.path);
      sourceFiles.push(sourceFile);
    }

    return sourceFiles;
  }

  private async processFile(sourceFile: SourceFile): Promise<void> {
    const filePath = sourceFile.getFilePath();

    if (this.options.verbose) {
      console.log(`  Processing: ${dim(relative(this.options.path, filePath))}`);
    }

    // Extract imports
    this.extractImports(sourceFile);

    // Extract symbols (functions, classes, interfaces, etc.)
    this.extractSymbols(sourceFile);

    // Extract types
    this.extractTypes(sourceFile);

    // Extract relationships
    this.extractRelationships(sourceFile);
  }

  private extractImports(sourceFile: SourceFile): void {
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const id = `import_${this.generateId()}`;
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const namedImports = importDecl.getNamedImports().map(n => n.getName());
      const defaultImport = importDecl.getDefaultImport()?.getText();
      const namespaceImport = importDecl.getNamespaceImport()?.getText();

      const specifiers = [
        ...(defaultImport ? [defaultImport] : []),
        ...(namespaceImport ? [`* as ${namespaceImport}`] : []),
        ...namedImports,
      ];

      this.imports.set(id, {
        id,
        sourceFile: sourceFile.getFilePath(),
        importedPath: moduleSpecifier,
        specifiers,
        isTypeOnly: importDecl.isTypeOnly(),
        isDefault: !!defaultImport,
        isNamespace: !!namespaceImport,
      });
    });
  }

  private extractSymbols(sourceFile: SourceFile): void {
    // Functions
    sourceFile.getFunctions().forEach(func => {
      this.addSymbol(func, "function", sourceFile);
    });

    // Classes
    sourceFile.getClasses().forEach(cls => {
      this.addSymbol(cls, "class", sourceFile);

      // Class methods
      cls.getMethods().forEach(method => {
        this.addSymbol(method, "method", sourceFile);
        this.addRelationship(method.getName(), cls.getName(), "MEMBER_OF");
      });

      // Class properties
      cls.getProperties().forEach(prop => {
        this.addSymbol(prop, "property", sourceFile);
        this.addRelationship(prop.getName(), cls.getName(), "MEMBER_OF");
      });
    });

    // Interfaces
    sourceFile.getInterfaces().forEach(iface => {
      this.addSymbol(iface, "interface", sourceFile);
    });

    // Type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      this.addSymbol(typeAlias, "type", sourceFile);
    });

    // Enums
    sourceFile.getEnums().forEach(enumDecl => {
      this.addSymbol(enumDecl, "enum", sourceFile);
    });

    // Variables and constants
    sourceFile.getVariableStatements().forEach(varStatement => {
      varStatement.getDeclarations().forEach(varDecl => {
        const kind = varStatement.isExported() ? "exported-var" : "variable";
        this.addSymbol(varDecl, kind, sourceFile);
      });
    });
  }

  private extractTypes(sourceFile: SourceFile): void {
    // Extract type information from interfaces
    sourceFile.getInterfaces().forEach(iface => {
      const id = `type_${this.generateId()}`;
      const typeParams = iface.getTypeParameters().map(p => p.getName());

      this.types.set(id, {
        id,
        name: iface.getName(),
        kind: "interface",
        definition: iface.getText(),
        isGeneric: typeParams.length > 0,
        typeParams,
        filePath: sourceFile.getFilePath(),
        line: iface.getStartLineNumber(),
      });
    });

    // Extract type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      const id = `type_${this.generateId()}`;
      const typeParams = typeAlias.getTypeParameters().map(p => p.getName());

      this.types.set(id, {
        id,
        name: typeAlias.getName(),
        kind: "alias",
        definition: typeAlias.getTypeNode()?.getText() || "",
        isGeneric: typeParams.length > 0,
        typeParams,
        filePath: sourceFile.getFilePath(),
        line: typeAlias.getStartLineNumber(),
      });
    });
  }

  private extractRelationships(sourceFile: SourceFile): void {
    // Extract class inheritance
    sourceFile.getClasses().forEach(cls => {
      const extendsExpr = cls.getExtends();
      if (extendsExpr) {
        this.addRelationship(cls.getName(), extendsExpr.getText(), "EXTENDS");
      }

      // Implements relationships
      cls.getImplements().forEach(impl => {
        this.addRelationship(cls.getName(), impl.getText(), "IMPLEMENTS");
      });
    });

    // Extract function calls (simplified - you'd want more sophisticated analysis)
    sourceFile.getFunctions().forEach(func => {
      func.forEachDescendant(node => {
        if (Node.isCallExpression(node)) {
          const expr = node.getExpression();
          if (Node.isIdentifier(expr)) {
            this.addRelationship(func.getName(), expr.getText(), "CALLS");
          }
        }
      });
    });
  }

  private addSymbol(node: Node, kind: string, sourceFile: SourceFile): void {
    const name = this.getNodeName(node);
    if (!name) return;

    const id = `symbol_${this.generateId()}`;
    const isExported = this.isNodeExported(node);
    const isAsync = this.isNodeAsync(node);
    const visibility = this.getNodeVisibility(node);
    const jsdoc = this.getNodeJSDoc(node);

    this.symbols.set(id, {
      id,
      name,
      kind,
      filePath: sourceFile.getFilePath(),
      line: node.getStartLineNumber(),
      column: node.getStartLinePos(),
      isExported,
      isAsync,
      visibility,
      jsdoc,
    });
  }

  private addRelationship(from: string, to: string, type: string, metadata?: Record<string, unknown>): void {
    this.relationships.push({ from, to, type, metadata });
  }

  private getNodeName(node: Node): string | undefined {
    if (Node.isFunctionDeclaration(node) || Node.isClassDeclaration(node) ||
        Node.isInterfaceDeclaration(node) || Node.isTypeAliasDeclaration(node) ||
        Node.isEnumDeclaration(node)) {
      return node.getName();
    }
    if (Node.isMethodDeclaration(node) || Node.isPropertyDeclaration(node)) {
      return node.getName();
    }
    if (Node.isVariableDeclaration(node)) {
      return node.getName();
    }
    return undefined;
  }

  private isNodeExported(node: Node): boolean {
    // Check if the node has an isExported method
    if ('isExported' in node && typeof (node as any).isExported === 'function') {
      return (node as any).isExported();
    }
    return false;
  }

  private isNodeAsync(node: Node): boolean {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return node.isAsync();
    }
    return false;
  }

  private getNodeVisibility(node: Node): string {
    if (Node.isMethodDeclaration(node) || Node.isPropertyDeclaration(node)) {
      if (node.hasModifier(SyntaxKind.PrivateKeyword)) return "private";
      if (node.hasModifier(SyntaxKind.ProtectedKeyword)) return "protected";
    }
    return "public";
  }

  private getNodeJSDoc(node: Node): string {
    // Check if the node has getJsDocs method
    if ('getJsDocs' in node && typeof (node as any).getJsDocs === 'function') {
      const jsDocs = (node as any).getJsDocs();
      if (jsDocs && jsDocs.length > 0) {
        return jsDocs[0].getDescription ? jsDocs[0].getDescription().trim() : "";
      }
    }
    return "";
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private async storeInKuzu(): Promise<void> {
    console.log(bold("\n💾 Storing AST data in Kuzu..."));

    // Prepare bulk insert commands
    const insertCommands: string[] = [];

    // Insert symbols
    this.symbols.forEach(symbol => {
      const values = [
        `'${symbol.id}'`,
        `'${symbol.name.replace(/'/g, "''")}'`,
        `'${symbol.kind}'`,
        `'${symbol.filePath.replace(/'/g, "''")}'`,
        symbol.line,
        symbol.column,
        symbol.isExported,
        symbol.isAsync,
        `'${symbol.visibility}'`,
        `'${symbol.jsdoc.replace(/'/g, "''")}'`,
        `''`, // git_sha
        `CURRENT_TIMESTAMP`,
      ].join(", ");

      insertCommands.push(`INSERT INTO Symbol VALUES (${values});`);
    });

    // Insert types
    this.types.forEach(type => {
      const values = [
        `'${type.id}'`,
        `'${type.name.replace(/'/g, "''")}'`,
        `'${type.kind}'`,
        `'${type.definition.substring(0, 500).replace(/'/g, "''")}'`,
        type.isGeneric,
        `['${type.typeParams.join("', '")}']`,
        `'${type.filePath.replace(/'/g, "''")}'`,
        type.line,
      ].join(", ");

      insertCommands.push(`INSERT INTO Type VALUES (${values});`);
    });

    // Execute inserts in batches
    await this.executeBulkKuzu(insertCommands);

    console.log(green(`✓ Stored ${this.symbols.size} symbols and ${this.types.size} types in Kuzu`));
  }

  private async executeBulkKuzu(commands: string[]): Promise<void> {
    const batchSize = 100;
    for (let i = 0; i < commands.length; i += batchSize) {
      const batch = commands.slice(i, i + batchSize);
      const batchScript = batch.join("\n");

      const cmd = new Deno.Command("kuzu", {
        args: [KUZU_DB_PATH],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      });

      const process = cmd.spawn();
      const writer = process.stdin.getWriter();
      const encoder = new TextEncoder();

      await writer.write(encoder.encode(batchScript + "\n.quit\n"));
      await writer.close();

      const { success } = await process.status;
      if (!success) {
        console.error(red("Failed to insert batch into Kuzu"));
      }
    }
  }

  private async storeMetricsInDuckDB(): Promise<void> {
    console.log(bold("\n📊 Calculating and storing metrics in DuckDB..."));

    // Calculate file-level metrics
    const fileMetrics: Map<string, any> = new Map();

    this.project.getSourceFiles().forEach(sourceFile => {
      const filePath = sourceFile.getFilePath();
      const lines = sourceFile.getEndLineNumber();
      const functions = sourceFile.getFunctions().length;
      const classes = sourceFile.getClasses().length;
      const imports = sourceFile.getImportDeclarations().length;
      const exports = sourceFile.getExportDeclarations().length;

      fileMetrics.set(filePath, {
        path: filePath,
        lines,
        functions,
        classes,
        imports,
        exports,
      });
    });

    // Store in DuckDB
    const insertCommands: string[] = [];
    fileMetrics.forEach(metrics => {
      const values = [
        `'${metrics.path.replace(/'/g, "''")}'`,
        metrics.lines,
        metrics.lines, // code_lines (simplified)
        0, // comment_lines
        0, // blank_lines
        0, // complexity_sum
        0, // complexity_avg
        metrics.imports,
        metrics.exports,
        metrics.classes,
        metrics.functions,
        `CURRENT_TIMESTAMP`,
      ].join(", ");

      insertCommands.push(`INSERT OR REPLACE INTO file_metrics VALUES (${values});`);
    });

    // Execute inserts
    if (insertCommands.length > 0) {
      const script = insertCommands.join("\n");
      const cmd = new Deno.Command("duckdb", {
        args: [DUCKDB_PATH, "-c", script],
        stdout: "piped",
        stderr: "piped",
      });

      const { success } = await cmd.output();
      if (success) {
        console.log(green(`✓ Stored metrics for ${fileMetrics.size} files in DuckDB`));
      } else {
        console.error(red("Failed to store metrics in DuckDB"));
      }
    }
  }
}

// CLI interface
async function main() {
  const args = parse(Deno.args, {
    string: ["path", "include", "exclude"],
    boolean: ["incremental", "verbose", "help"],
    default: {
      path: ".",
      incremental: false,
      verbose: false,
    },
  });

  if (args.help) {
    console.log(`
${bold("scan-codebase")} - Extract TypeScript/JavaScript AST into semantic database

${bold("Usage:")}
  deno task scan [options]

${bold("Options:")}
  --path <dir>        Directory to scan (default: current directory)
  --incremental       Only scan changed files
  --verbose           Show detailed progress
  --include <pattern> Include only matching paths (comma-separated)
  --exclude <pattern> Exclude matching paths (comma-separated)
  --help              Show this help message

${bold("Examples:")}
  deno task scan
  deno task scan --path ./src --verbose
  deno task scan --include src,lib --exclude test
`);
    Deno.exit(0);
  }

  const options: ScanOptions = {
    path: args.path,
    incremental: args.incremental,
    verbose: args.verbose,
    include: args.include?.split(","),
    exclude: args.exclude?.split(","),
  };

  console.log(bold(green("\n🚀 TypeScript/JavaScript AST Scanner")));
  console.log("=" .repeat(50));

  const scanner = new ASTScanner(options);
  await scanner.scan();

  console.log(bold(green("\n✅ Scan complete!")));
  console.log("\nNext steps:");
  console.log("  1. Run", bold("deno task query"), "to query the semantic database");
  console.log("  2. Run", bold("deno task analyze"), "to generate analysis reports");
  console.log("  3. Run", bold("deno task watch"), "to keep database synchronized");
}

if (import.meta.main) {
  await main();
}