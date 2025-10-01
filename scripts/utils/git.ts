/**
 * Git operations utility
 * Provides functions for interacting with git repositories
 */

/**
 * Check if the current directory is inside a git repository
 * @returns true if in a git repo, false otherwise
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    const command = new Deno.Command("git", {
      args: ["rev-parse", "--git-dir"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await command.output();
    return code === 0;
  } catch {
    return false;
  }
}

/**
 * Get the current commit SHA
 * @returns Full 40-character SHA-1 hash of current commit
 * @throws Error if not in a git repository
 */
export async function getCurrentSha(): Promise<string> {
  const command = new Deno.Command("git", {
    args: ["rev-parse", "HEAD"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get current SHA: ${error}`);
  }

  const sha = new TextDecoder().decode(stdout).trim();
  return sha;
}

/**
 * Get the git repository root directory
 * @returns Absolute path to git root
 * @throws Error if not in a git repository
 */
export async function getGitRoot(): Promise<string> {
  const command = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get git root: ${error}`);
  }

  const root = new TextDecoder().decode(stdout).trim();
  return root;
}

/**
 * Get the git status of a file
 * @param filePath - Path to the file (relative to repo root or absolute)
 * @returns Status code: 'M' (modified), 'A' (added), 'D' (deleted), '??' (untracked), '' (unchanged/not found)
 */
export async function getFileStatus(filePath: string): Promise<string> {
  const command = new Deno.Command("git", {
    args: ["status", "--porcelain", filePath],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout).trim();

  if (!output) {
    return "";
  }

  // Git status --porcelain format: XY filename
  // X is index status, Y is working tree status
  // We'll return the working tree status (Y) if present, otherwise index status (X)
  const statusLine = output.split("\n")[0];
  if (!statusLine || statusLine.length < 2) {
    return "";
  }

  // For untracked files: "?? filename"
  if (statusLine.startsWith("??")) {
    return "??";
  }

  // For other files: "XY filename" where X is index, Y is worktree
  // Return the working tree status (position 1)
  const worktreeStatus = statusLine[1].trim();
  if (worktreeStatus) {
    return worktreeStatus;
  }

  // If no working tree status, return index status (position 0)
  return statusLine[0];
}