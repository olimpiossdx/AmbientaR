export const FAD_WORKSPACES_COLLECTION = "fad_workspaces";

export function fadWorkspacePath(workspaceId: string): string {
  return `${FAD_WORKSPACES_COLLECTION}/${workspaceId}`;
}

export function fadAvailabilityPath(geohash6: string, year: number): string {
  return `fad_availability/${geohash6}_${year}`;
}
