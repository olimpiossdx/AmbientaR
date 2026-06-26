"use client";

import { useState } from "react";
import type { Auth } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";

export function OnedriveDownloadButton({
  auth,
  itemId,
  clientId,
  fileName,
  className,
}: {
  auth: Auth | null | undefined;
  itemId: string;
  clientId: string;
  fileName: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch(
        `/api/onedrive/items/${encodeURIComponent(itemId)}/content?clientId=${encodeURIComponent(clientId)}`,
        { headers },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || `HTTP ${res.status}`,
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "documento";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className={className}
      disabled={loading}
      onClick={() => void handleDownload()}
    >
      {loading ? "Abrindo…" : "Ver / baixar"}
    </Button>
  );
}
