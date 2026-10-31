/** Folder-safe vault name (pure, kept apart from native file APIs). */
export function folderName(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 60) || 'Vault';
}
