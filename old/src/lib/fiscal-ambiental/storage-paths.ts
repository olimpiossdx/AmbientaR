export function fadArchiveStoragePrefix(workspaceId: string, archiveId: string): string {
  return `fad/${workspaceId}/archives/${archiveId}`;
}

export function fadAnalysisStoragePrefix(workspaceId: string, analysisId: string): string {
  return `fad/${workspaceId}/analyses/${analysisId}`;
}

export function fadReportStoragePrefix(workspaceId: string, reportId: string): string {
  return `fad/${workspaceId}/reports/${reportId}`;
}
