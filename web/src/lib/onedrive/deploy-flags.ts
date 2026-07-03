function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function isOnedriveSyncEnabled(): boolean {
  return parseBooleanEnv(process.env.ONEDRIVE_SYNC_ENABLED, false);
}

/** Portal Documentos Ambientais → Pasta do cliente (client / representative). */
export function isOnedriveClientPortalEnabled(): boolean {
  return parseBooleanEnv(process.env.ONEDRIVE_CLIENT_READONLY_ENABLED, false);
}

export function isOnedriveAutonomoWriteEnabled(): boolean {
  return parseBooleanEnv(process.env.ONEDRIVE_AUTONOMO_WRITE_ENABLED, false);
}

export function isMicrosoftGraphConfigured(): boolean {
  return Boolean(
    process.env.MICROSOFT_GRAPH_TENANT_ID?.trim() &&
      process.env.MICROSOFT_GRAPH_CLIENT_ID?.trim() &&
      process.env.MICROSOFT_GRAPH_CLIENT_SECRET?.trim(),
  );
}
