import { api } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
import type { ApiResponse } from "../../service/http/types";
import { parseCalendarEvent, parseCalendarEventList, validateCalendarEventFilters, validateCalendarEventInput } from "./agenda.schemas";
import type { CalendarEvent, CalendarEventFilters, CalendarEventInput, CalendarEventInviteInput, CalendarEventList, CalendarEventRespondInput } from "./agenda.types";

export class AgendaApiError extends Error {
 readonly httpStatus: number;
 readonly code?: string;

 constructor(message: string, httpStatus: number, code?: string) {
  super(message);
  this.name = "AgendaApiError";
  this.httpStatus = httpStatus;
  this.code = code;
 }
}

export function isAgendaAbortError(error: unknown): boolean {
 return error instanceof AgendaApiError && error.code === "REQUEST_ABORTED";
}

function dataOrThrow<T>(response: ApiResponse<T>): T {
 if (!response.ok || response.data === null) {
  throw new AgendaApiError(
   agendaErrorMessage(response.httpStatus, response.error?.message),
   response.httpStatus,
   response.error?.code,
  );
 }
 return response.data;
}

export function agendaErrorMessage(httpStatus: number, apiMessage?: string): string {
 if (apiMessage?.trim()) return apiMessage;
 if (httpStatus === 0) return "A API da agenda esta indisponivel. Verifique sua conexao e tente novamente.";
 if (httpStatus === 401) return "Sua sessao expirou. Entre novamente para acessar a agenda.";
 if (httpStatus === 403) return "Voce nao possui permissao para esta operacao.";
 if (httpStatus === 404) return "O evento nao existe mais ou esta fora do seu escopo.";
 if (httpStatus === 409) return "O evento foi alterado por outra pessoa. Atualize a agenda antes de tentar novamente.";
 if (httpStatus === 422 || httpStatus === 400) return "Os dados informados sao invalidos. Revise os campos e tente novamente.";
 if (httpStatus >= 500) return "A API da agenda esta temporariamente indisponivel. Tente novamente em instantes.";
 return "Nao foi possivel concluir a operacao.";
}

export function createAgendaService(client: HttpClient) {
 return {
  async list(filters: CalendarEventFilters = {}, signal?: AbortSignal): Promise<CalendarEventList> {
   validateCalendarEventFilters(filters);
   const page = Math.max(1, Math.trunc(filters.page ?? 1));
   const size = Math.min(100, Math.max(1, Math.trunc(filters.size ?? 10)));
   const response = await client.get<unknown>("/calendar-events", {
    signal,
    params: {
     search: filters.search?.trim() || undefined,
     startsFrom: filters.startsFrom || undefined,
     startsTo: filters.startsTo || undefined,
     status: filters.status === "all" ? undefined : filters.status,
     page,
     size,
    },
   });
   return parseCalendarEventList(dataOrThrow(response), response.total, page, size);
  },
  async get(id: string, signal?: AbortSignal): Promise<CalendarEvent> {
   return parseCalendarEvent(dataOrThrow(await client.get<unknown>(`/calendar-events/${encodeURIComponent(id)}`, { signal })));
  },
  async create(input: CalendarEventInput): Promise<CalendarEvent> {
   return parseCalendarEvent(dataOrThrow(await client.post<unknown, CalendarEventInput>("/calendar-events", validateCalendarEventInput(input))));
  },
  async update(id: string, input: CalendarEventInput): Promise<CalendarEvent> {
   return parseCalendarEvent(dataOrThrow(await client.patch<unknown, CalendarEventInput>(`/calendar-events/${encodeURIComponent(id)}`, validateCalendarEventInput(input))));
  },
  async remove(id: string): Promise<void> {
   const response = await client.delete<unknown>(`/calendar-events/${encodeURIComponent(id)}`);
   if (!response.ok) throw new AgendaApiError(response.error?.message ?? "Nao foi possivel excluir o evento.", response.httpStatus, response.error?.code);
  },
  async invite(id: string, input: CalendarEventInviteInput): Promise<CalendarEvent> {
   const userIds = [...new Set(input.userIds.map((item) => item.trim()).filter(Boolean))];
   if (userIds.length === 0) throw new Error("Informe ao menos um usuario para convidar.");
   return parseCalendarEvent(dataOrThrow(await client.post<unknown, CalendarEventInviteInput>(
    `/calendar-events/${encodeURIComponent(id)}/invite`, { ...input, userIds },
   )));
  },
  async respond(id: string, input: CalendarEventRespondInput): Promise<CalendarEvent> {
   return parseCalendarEvent(dataOrThrow(await client.post<unknown, CalendarEventRespondInput>(
    `/calendar-events/${encodeURIComponent(id)}/respond`, input,
   )));
  },
 };
}

export const agendaService = createAgendaService(api);
