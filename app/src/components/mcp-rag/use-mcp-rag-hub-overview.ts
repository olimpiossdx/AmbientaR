"use client";

import * as React from "react";
import type { Auth } from "firebase/auth";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";
import type { McpRagHubOverview } from "@/lib/mcp-rag/types";

export function useMcpRagHubOverview(auth: Auth | null) {
  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState<McpRagHubOverview | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/mcp-rag/hub-overview", { headers });
      const data = await parseApiJsonResponse<{
        overview?: McpRagHubOverview;
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error || "Falha ao carregar hub MCP+RAG.");
      }
      setOverview(data.overview ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [auth]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, overview, error, refresh };
}
