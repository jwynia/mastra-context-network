/**
 * File hashing utility for change detection
 * Uses SHA-256 for content hashing with good performance
 */

/**
 * Hash a string using SHA-256
 * @param content - The string content to hash
 * @returns Hex-encoded hash string
 */
export async function hashString(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Hash a file using SHA-256
 * @param filePath - Path to the file to hash
 * @returns Hex-encoded hash string
 * @throws Error if file cannot be read
 */
export async function hashFile(filePath: string): Promise<string> {
  try {
    const content = await Deno.readTextFile(filePath);
    return await hashString(content);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Hash multiple files in parallel
 * @param filePaths - Array of file paths to hash
 * @returns Object mapping file paths to their hashes
 * @note Skips files that cannot be read (logs warning)
 */
export async function hashFiles(filePaths: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const hash = await hashFile(filePath);
        results[filePath] = hash;
      } catch (error) {
        // Skip files that can't be read
        // In production, this would log a warning
        return;
      }
    })
  );

  return results;
}