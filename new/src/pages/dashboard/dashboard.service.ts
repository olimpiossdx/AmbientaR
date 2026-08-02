import { api } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
import type { ApiResponse } from "../../service/http/types";
import { parseDashboard } from "./dashboard.schemas";
import type { DashboardDto } from "./dashboard.types";

export class DashboardApiError extends Error {
 readonly httpStatus: number;
 readonly code?: string;

 constructor(message: string, httpStatus: number, code?: string) {
  super(message);
  this.name = "DashboardApiError";
  this.httpStatus = httpStatus;
  this.code = code;
 }
}

function dataOrThrow(response: ApiResponse<unknown>): unknown {
 if (!response.ok || response.data === null) {
  throw new DashboardApiError(
   response.error?.message || "Nao foi possivel carregar o painel.",
   response.httpStatus,
   response.error?.code,
  );
 }
 return response.data;
}

export function dashboardErrorMessage(error: unknown): string {
 if (!(error instanceof DashboardApiError)) {
  return error instanceof Error && error.message.startsWith("Contrato invalido")
   ? "A API retornou um painel em formato invalido."
   : "Nao foi possivel carregar o painel.";
 }
 if (error.httpStatus === 401) return "Sua sessao expirou. Entre novamente para acessar o painel.";
 if (error.httpStatus === 403) return "Voce nao possui permissao para visualizar este painel ou o escopo solicitado.";
 if (error.httpStatus === 404) return "O painel ainda nao esta disponivel para este escopo.";
 if (error.httpStatus === 409) return "Os dados do painel foram atualizados. Tente carregar novamente.";
 if (error.httpStatus === 0 || error.httpStatus >= 500) return "O painel esta temporariamente indisponivel. Tente novamente em instantes.";
 return "Nao foi possivel carregar o painel.";
}

export function createDashboardService(client: HttpClient) {
 return {
  async get(signal?: AbortSignal): Promise<DashboardDto> {
   const response = await client.get<unknown>("/dashboard", { signal });
   return parseDashboard(dataOrThrow(response));
  },
 };
}

export const dashboardService = createDashboardService(api);
