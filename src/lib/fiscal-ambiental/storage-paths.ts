export function fadArchiveStoragePrefix(workspaceId: string, archiveId: string): string {
  return `fad/${workspaceId}/archives/${archiveId}`;
}
