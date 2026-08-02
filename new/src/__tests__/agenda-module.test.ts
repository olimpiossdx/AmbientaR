import assert from "node:assert/strict";
import test from "node:test";
import type { HttpClient } from "../service/http/client";
import type { ApiResponse, HttpMethod } from "../service/http/types";
import { parseCalendarEventList, validateCalendarEventFilters, validateCalendarEventInput } from "../modules/agenda/agenda.schemas";
import { AgendaApiError, agendaErrorMessage, createAgendaService } from "../modules/agenda/agenda.service";
import { AGENDA_CLAIMS, type CalendarEventInput } from "../modules/agenda/agenda.types";
import { buildAgendaSearch, dateToUrlValue, parseAgendaUrlState, urlValueToDate } from "../modules/agenda/agenda-url-state";

const event = {
 id: "event-1",
 title: "Reuniao ambiental",
 description: null,
 startsAt: "2026-07-22T12:00:00.000Z",
 endsAt: "2026-07-22T13:00:00.000Z",
 allDay: false,
 status: "scheduled",
 location: "Sala 1",
 ownerId: "user-1",
 isPublic: false,
};

function response<T>(data: T, ok = true, httpStatus = 200): ApiResponse<T> {
 return {
  ok, status: ok ? "success" : "error", httpStatus, data: ok ? data : null,
  error: ok ? null : { code: "FORBIDDEN", message: "Sem permissao" },
  notifications: [], headers: new Headers(),
  request: { url: "/calendar-events", method: "GET" as HttpMethod, attempts: 1, retried: false },
 };
}

test("agenda define uma claim independente para cada acao", () => {
 assert.deepEqual(Object.values(AGENDA_CLAIMS).map((claim) => claim.claimValue), ["visualizar", "criar", "editar", "excluir", "convidar", "responder"]);
 assert.ok(Object.values(AGENDA_CLAIMS).every((claim) => claim.claimType === "recurso.agenda"));
});

test("schema aceita lista envelopada e preserva total paginado", () => {
 const parsed = parseCalendarEventList({ items: [event], total: 12 });
 assert.equal(parsed.items[0]?.id, "event-1");
 assert.equal(parsed.total, 12);
});

test("schema recusa termino anterior ou igual ao inicio", () => {
 const input: CalendarEventInput = {
  title: "Evento valido", startsAt: "2026-07-22T13:00:00.000Z", endsAt: "2026-07-22T12:00:00.000Z",
  allDay: false, status: "scheduled", isPublic: false,
 };
 assert.throws(() => validateCalendarEventInput(input), /termino deve ser posterior/i);
 assert.throws(() => validateCalendarEventInput({ ...input, startsAt: input.endsAt }), /termino deve ser posterior/i);
});

test("schema recusa intervalo de filtro invertido antes de chamar a API", () => {
 assert.throws(
  () => validateCalendarEventFilters({ startsFrom: "2026-08-02", startsTo: "2026-08-01" }),
  /data final.*posterior/i,
 );
});

test("estado da agenda faz round-trip na URL e preserva parametros externos", () => {
 const search = buildAgendaSearch("?tenant=acme", {
  filters: { search: "  reuniao  ", status: "confirmed", startsFrom: "2026-07-01", startsTo: "2026-07-31" },
  page: 3,
  selectedDate: "2026-07-23",
 });
 const parsed = parseAgendaUrlState(search);
 assert.equal(new URLSearchParams(search).get("tenant"), "acme");
 assert.deepEqual(parsed, {
  filters: { search: "reuniao", status: "confirmed", startsFrom: "2026-07-01", startsTo: "2026-07-31" },
  page: 3,
  selectedDate: "2026-07-23",
 });
});

test("estado da URL ignora valores invalidos e datas usam o fuso local", () => {
 assert.deepEqual(parseAgendaUrlState("?status=unknown&page=-2&from=ontem"), {
  filters: { search: undefined, status: "all", startsFrom: undefined, startsTo: undefined },
  page: 1,
  selectedDate: undefined,
 });
 const date = urlValueToDate("2026-07-23");
 assert.ok(date);
 assert.equal(dateToUrlValue(date), "2026-07-23");
});

test("mensagens de falha cobrem sessao, ausencia, conflito e indisponibilidade", () => {
 assert.match(agendaErrorMessage(401), /sessao expirou/i);
 assert.match(agendaErrorMessage(404), /nao existe mais/i);
 assert.match(agendaErrorMessage(409), /alterado por outra pessoa/i);
 assert.match(agendaErrorMessage(503), /temporariamente indisponivel/i);
 assert.match(agendaErrorMessage(0), /indisponivel/i);
 assert.equal(agendaErrorMessage(409, "Versao divergente"), "Versao divergente");
});

test("service lista pelo cliente central e serializa filtros", async () => {
 let receivedUrl = "";
 let receivedParams: unknown;
 const client = {
  get: async (url: string, config: { params?: unknown }) => {
   receivedUrl = url; receivedParams = config.params;
   return { ...response([event]), total: 37 };
  },
 } as unknown as HttpClient;
 const result = await createAgendaService(client).list({ search: " reuniao ", status: "confirmed", page: 2, size: 15 });
 assert.equal(receivedUrl, "/calendar-events");
 assert.deepEqual(receivedParams, { search: "reuniao", startsFrom: undefined, startsTo: undefined, status: "confirmed", page: 2, size: 15 });
 assert.equal(result.total, 37);
 assert.equal(result.page, 2);
 assert.equal(result.size, 15);
});

test("service usa PATCH para editar e endpoints REST para convite e resposta", async () => {
 const calls: Array<{ method: string; url: string; body: unknown }> = [];
 const client = {
  patch: async (url: string, body: unknown) => { calls.push({ method: "PATCH", url, body }); return response(event); },
  post: async (url: string, body: unknown) => { calls.push({ method: "POST", url, body }); return response(event); },
 } as unknown as HttpClient;
 const service = createAgendaService(client);
 const input: CalendarEventInput = {
  title: "Reuniao ambiental", startsAt: event.startsAt, endsAt: event.endsAt,
  allDay: false, status: "scheduled", isPublic: false,
 };
 await service.update("event/1", input);
 await service.invite("event/1", { userIds: [" user-1 ", "user-1", "user-2"] });
 await service.respond("event/1", { response: "accepted" });
 assert.equal(calls[0]?.method, "PATCH");
 assert.equal(calls[0]?.url, "/calendar-events/event%2F1");
 assert.deepEqual(calls[1], { method: "POST", url: "/calendar-events/event%2F1/invite", body: { userIds: ["user-1", "user-2"] } });
 assert.deepEqual(calls[2], { method: "POST", url: "/calendar-events/event%2F1/respond", body: { response: "accepted" } });
});

test("service transforma 403 da API em erro de agenda tipado", async () => {
 const client = { get: async () => response(null, false, 403) } as unknown as HttpClient;
 await assert.rejects(() => createAgendaService(client).list(), (error: unknown) => {
  assert.ok(error instanceof AgendaApiError);
  assert.equal(error.httpStatus, 403);
  assert.equal(error.code, "FORBIDDEN");
  return true;
 });
});
