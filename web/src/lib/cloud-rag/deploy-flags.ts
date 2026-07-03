import { isMicrosoftGraphConfigured } from "@/lib/onedrive/deploy-flags";

function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function isCloudRagEnabled(): boolean {
  return parseBooleanEnv(process.env.ONEDRIVE_RAG_ENABLED, false);
}

export function isCloudRagSearchEnabled(): boolean {
  return (
    isCloudRagEnabled() &&
    parseBooleanEnv(process.env.ONEDRIVE_RAG_SEARCH_ENABLED, true)
  );
}

export function assertCloudRagGraphReady(): boolean {
  return isCloudRagEnabled() && isMicrosoftGraphConfigured();
}
