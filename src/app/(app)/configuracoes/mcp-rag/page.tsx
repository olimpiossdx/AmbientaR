"use client";

import { Suspense } from "react";
import { McpRagHub } from "@/components/mcp-rag/mcp-rag-hub";

export default function McpRagHubPage() {
  return (
    <Suspense fallback={null}>
      <McpRagHub />
    </Suspense>
  );
}
