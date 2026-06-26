import type { ListasAgenteResult } from "@/lib/socioambiental/listas-agente-types";

export async function fetchListasAgenteClient(
  token: string,
  params: {
    documento: string;
    criterioIds?: string[];
    codImovel?: string;
    beneficiariosCpr?: string[];
  },
): Promise<ListasAgenteResult> {
  const res = await fetch("/api/socioambiental/listas-agente", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = (await res.json()) as {
    error?: string;
    result?: ListasAgenteResult;
  };

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  if (!data.result) {
    throw new Error("Resposta inválida da consulta de listas.");
  }

  return data.result;
}
