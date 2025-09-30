/**
 * AST Analyzer - Core module for extracting TypeScript/JavaScript AST information
 */

import { Project, Node, SourceFile, SyntaxKind } from "npm:ts-morph@22.0.0";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

// Re-export types for consumers
export interface ExtractedSymbol {
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

export interface ExtractedType {
  id: string;
  name: string;
  kind: string;
  definition: string;
  isGeneric: boolean;
  typeParams: string[];
  filePath: string;
  line: number;
}

export interface ExtractedImport {
  id: string;
  sourceFile: string;
  importedPath: string;
  specifiers: string[];
  isTypeOnly: boolean;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface ASTAnalyzerOptions {
  tsConfigPath?: string;
  defaultCompilerOptions?: Record<string, any>;
}

export class ASTAnalyzer {
  private project: Project;
  private idCounter = 0;

  constructor(options: ASTAnalyzerOptions = {}) {
    this.project = new Project({
      tsConfigFilePath: options.tsConfigPath,
      compilerOptions: options.defaultCompilerOptions || {
        target: 22, // ES2022
        module: 199, // NodeNext
        lib: ["es2022"],
        allowJs: true,
        checkJs: false,
        strict: true,
      },
      skipAddingFilesFromTsConfig: true,
    });
  }

  /**
   * Add source files to the project
   */
  addSourceFiles(paths: string[]): SourceFile[] {
    return paths.map(path => this.project.addSourceFileAtPath(path));
  }

  /**
   * Extract all data from a source file
   */
  analyzeFile(sourceFile: SourceFile): {
    symbols: ExtractedSymbol[];
    types: ExtractedType[];
    imports: ExtractedImport[];
    relationships: Relationship[];
  } {
    const symbols: ExtractedSymbol[] = [];
    const types: ExtractedType[] = [];
    const imports = this.extractImports(sourceFile);
    const relationships: Relationship[] = [];

    // Extract symbols
    const extractedSymbols = this.extractSymbols(sourceFile);
    symbols.push(...extractedSymbols.symbols);
    relationships.push(...extractedSymbols.relationships);

    // Extract types
    types.push(...this.extractTypes(sourceFile));

    // Extract relationships
    relationships.push(...this.extractRelationships(sourceFile));

    return { symbols, types, imports, relationships };
  }

  /**
   * Extract import statements
   */
  private extractImports(sourceFile: SourceFile): ExtractedImport[] {
    const imports: ExtractedImport[] = [];

    sourceFile.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const namedImports = importDecl.getNamedImports().map(n => n.getName());
      const defaultImport = importDecl.getDefaultImport()?.getText();
      const namespaceImport = importDecl.getNamespaceImport()?.getText();

      const specifiers = [
        ...(defaultImport ? [defaultImport] : []),
        ...(namespaceImport ? [`* as ${namespaceImport}`] : []),
        ...namedImports,
      ];

      imports.push({
        id: this.generateId("import"),
        sourceFile: sourceFile.getFilePath(),
        importedPath: moduleSpecifier,
        specifiers,
        isTypeOnly: importDecl.isTypeOnly(),
        isDefault: !!defaultImport,
        isNamespace: !!namespaceImport,
      });
    });

    return imports;
  }

  /**
   * Extract symbols (functions, classes, interfaces, etc.)
   */
  private extractSymbols(sourceFile: SourceFile): {
    symbols: ExtractedSymbol[];
    relationships: Relationship[];
  } {
    const symbols: ExtractedSymbol[] = [];
    const relationships: Relationship[] = [];

    // Functions
    sourceFile.getFunctions().forEach(func => {
      symbols.push(this.createSymbol(func, "function", sourceFile));
    });

    // Classes
    sourceFile.getClasses().forEach(cls => {
      const className = cls.getName();
      if (className) {
        symbols.push(this.createSymbol(cls, "class", sourceFile));

        // Class methods
        cls.getMethods().forEach(method => {
          const methodSymbol = this.createSymbol(method, "method", sourceFile);
          symbols.push(methodSymbol);
          relationships.push({
            from: methodSymbol.name,
            to: className,
            type: "MEMBER_OF",
          });
        });

        // Class properties
        cls.getProperties().forEach(prop => {
          const propSymbol = this.createSymbol(prop, "property", sourceFile);
          symbols.push(propSymbol);
          relationships.push({
            from: propSymbol.name,
            to: className,
            type: "MEMBER_OF",
          });
        });
      }
    });

    // Interfaces
    sourceFile.getInterfaces().forEach(iface => {
      symbols.push(this.createSymbol(iface, "interface", sourceFile));
    });

    // Type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      symbols.push(this.createSymbol(typeAlias, "type", sourceFile));
    });

    // Enums
    sourceFile.getEnums().forEach(enumDecl => {
      symbols.push(this.createSymbol(enumDecl, "enum", sourceFile));
    });

    // Variables and constants
    sourceFile.getVariableStatements().forEach(varStatement => {
      varStatement.getDeclarations().forEach(varDecl => {
        const kind = varStatement.isExported() ? "exported-var" : "variable";
        symbols.push(this.createSymbol(varDecl, kind, sourceFile));
      });
    });

    return { symbols, relationships };
  }

  /**
   * Extract type information
   */
  private extractTypes(sourceFile: SourceFile): ExtractedType[] {
    const types: ExtractedType[] = [];

    // Extract type information from interfaces
    sourceFile.getInterfaces().forEach(iface => {
      const typeParams = iface.getTypeParameters().map(p => p.getName());

      types.push({
        id: this.generateId("type"),
        name: iface.getName(),
        kind: "interface",
        definition: iface.getText().substring(0, 500),
        isGeneric: typeParams.length > 0,
        typeParams,
        filePath: sourceFile.getFilePath(),
        line: iface.getStartLineNumber(),
      });
    });

    // Extract type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      const typeParams = typeAlias.getTypeParameters().map(p => p.getName());

      types.push({
        id: this.generateId("type"),
        name: typeAlias.getName(),
        kind: "alias",
        definition: typeAlias.getTypeNode()?.getText() || "",
        isGeneric: typeParams.length > 0,
        typeParams,
        filePath: sourceFile.getFilePath(),
        line: typeAlias.getStartLineNumber(),
      });
    });

    return types;
  }

  /**
   * Extract relationships between symbols
   */
  private extractRelationships(sourceFile: SourceFile): Relationship[] {
    const relationships: Relationship[] = [];

    // Extract class inheritance
    sourceFile.getClasses().forEach(cls => {
      const className = cls.getName();
      if (!className) return;

      const extendsExpr = cls.getExtends();
      if (extendsExpr) {
        relationships.push({
          from: className,
          to: extendsExpr.getText(),
          type: "EXTENDS",
        });
      }

      // Implements relationships
      cls.getImplements().forEach(impl => {
        relationships.push({
          from: className,
          to: impl.getText(),
          type: "IMPLEMENTS",
        });
      });
    });

    // Extract function calls (simplified)
    sourceFile.getFunctions().forEach(func => {
      const funcName = func.getName();
      if (!funcName) return;

      func.forEachDescendant(node => {
        if (Node.isCallExpression(node)) {
          const expr = node.getExpression();
          if (Node.isIdentifier(expr)) {
            relationships.push({
              from: funcName,
              to: expr.getText(),
              type: "CALLS",
            });
          }
        }
      });
    });

    return relationships;
  }

  /**
   * Create a symbol from a node
   */
  private createSymbol(node: Node, kind: string, sourceFile: SourceFile): ExtractedSymbol {
    const name = this.getNodeName(node) || "anonymous";

    return {
      id: this.generateId("symbol"),
      name,
      kind,
      filePath: sourceFile.getFilePath(),
      line: node.getStartLineNumber(),
      column: node.getStartLinePos(),
      isExported: this.isNodeExported(node),
      isAsync: this.isNodeAsync(node),
      visibility: this.getNodeVisibility(node),
      jsdoc: this.getNodeJSDoc(node),
    };
  }

  /**
   * Helper methods for node properties
   */
  private getNodeName(node: Node): string | undefined {
    if ('getName' in node && typeof (node as any).getName === 'function') {
      return (node as any).getName();
    }
    return undefined;
  }

  private isNodeExported(node: Node): boolean {
    if ('isExported' in node && typeof (node as any).isExported === 'function') {
      return (node as any).isExported();
    }
    return false;
  }

  private isNodeAsync(node: Node): boolean {
    if ('isAsync' in node && typeof (node as any).isAsync === 'function') {
      return (node as any).isAsync();
    }
    return false;
  }

  private getNodeVisibility(node: Node): string {
    if ('hasModifier' in node && typeof (node as any).hasModifier === 'function') {
      if ((node as any).hasModifier(SyntaxKind.PrivateKeyword)) return "private";
      if ((node as any).hasModifier(SyntaxKind.ProtectedKeyword)) return "protected";
    }
    return "public";
  }

  private getNodeJSDoc(node: Node): string {
    if ('getJsDocs' in node && typeof (node as any).getJsDocs === 'function') {
      const jsDocs = (node as any).getJsDocs();
      if (jsDocs && jsDocs.length > 0) {
        return jsDocs[0].getDescription ? jsDocs[0].getDescription().trim() : "";
      }
    }
    return "";
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${this.idCounter++}`;
  }
}