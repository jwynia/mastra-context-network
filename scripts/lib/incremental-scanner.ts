/**
 * Incremental scanner for detecting file changes
 * Compares file hashes to determine what needs rescanning
 */

export type FileHashRecord = Record<string, string>;

export interface FileChanges {
  added: string[];
  modified: string[];
  deleted: string[];
}

/**
 * IncrementalScanner detects changes between file hash snapshots
 *
 * @example
 * ```ts
 * const scanner = new IncrementalScanner();
 * const changes = scanner.detectChanges(oldHashes, newHashes);
 * const filesToRescan = scanner.needsRescan(oldHashes, newHashes);
 * ```
 */
export class IncrementalScanner {
  /**
   * Detect changes between two file hash snapshots
   * @param previous - Previous hash record
   * @param current - Current hash record
   * @returns Object with added, modified, and deleted file arrays
   */
  detectChanges(previous: FileHashRecord, current: FileHashRecord): FileChanges {
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    // Find added and modified files
    for (const [file, hash] of Object.entries(current)) {
      if (!(file in previous)) {
        added.push(file);
      } else if (previous[file] !== hash) {
        modified.push(file);
      }
    }

    // Find deleted files
    for (const file of Object.keys(previous)) {
      if (!(file in current)) {
        deleted.push(file);
      }
    }

    return { added, modified, deleted };
  }

  /**
   * Get list of files that need rescanning
   * Returns added and modified files (not deleted)
   * @param previous - Previous hash record
   * @param current - Current hash record
   * @returns Array of file paths that need rescanning
   */
  needsRescan(previous: FileHashRecord, current: FileHashRecord): string[] {
    const changes = this.detectChanges(previous, current);
    return [...changes.added, ...changes.modified];
  }
}