import type { Auth } from "firebase/auth";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";

export type OnedriveAutofillApiResponse = {
  success: boolean;
  error?: string;
  clientId?: string | null;
  clientName?: string | null;
  folderPath?: string | null;
  folderLinked?: boolean;
  catalogFileCount?: number;
  ragChunkCount?: number;
  extractedFileCount?: number;
  evidenceText?: string;
  citations?: string[];
  hints?: string[];
  diagnostics?: string;
};

function normalizeOnedriveErrorMessage(message: string | undefined): string {
  const raw = (message || "").trim();
  if (!raw) return "Integração OneDrive indisponível no momento.";

  const lower = raw.toLowerCase();
  if (
    lower.includes("tenant does not have spo license") ||
    lower.includes("badrequest") ||
    lower.includes("spo license")
  ) {
    return (
      "OneDrive corporativo indisponível neste tenant (licença SharePoint/OneDrive)." +
      " O preenchimento continuará com base interna/local."
    );
  }
  if (lower.includes("microsoft graph não configurado")) {
    return "OneDrive não configurado no servidor. O preenchimento seguirá com base interna/local.";
  }
  if (lower.includes("token em falta") || lower.includes("sessão")) {
    return "Sessão expirada para APIs de autofill. Faça login novamente.";
  }
  return raw;
}

/** Busca evidências na pasta OneDrive vinculada ao cliente (servidor). */
export async function fetchOnedriveAutofillContext(
  auth: Auth | null,
  cpfCnpj: string,
): Promise<OnedriveAutofillApiResponse> {
  try {
    const headers = await getAdminApiRequestHeaders(auth);
    const res = await fetch("/api/onedrive/autofill-by-cpf", {
      method: "POST",
      headers,
      body: JSON.stringify({ cpfCnpj }),
    });
    const data = await parseApiJsonResponse<OnedriveAutofillApiResponse>(res);
    if (!res.ok || !data.success) {
      const normalizedError = normalizeOnedriveErrorMessage(data.error);
      return {
        success: false,
        error:
          normalizedError ||
          `Falha OneDrive (${res.status}). Verifique .env.local e credenciais Graph.`,
        hints: data.hints?.length
          ? data.hints.map((h) => normalizeOnedriveErrorMessage(h))
          : [
              normalizedError ||
                "Integração OneDrive indisponível. Confira MICROSOFT_GRAPH_* e reinicie o npm run dev.",
            ],
      };
    }
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: normalizeOnedriveErrorMessage(message),
      hints: [
        normalizeOnedriveErrorMessage(message),
        "Erro de rede ou sessão ao contactar o servidor. Faça login novamente.",
      ],
    };
  }
}
