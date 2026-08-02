import assert from "node:assert/strict";
import test from "node:test";
import type { HttpClient } from "../service/http/client";
import type { ApiResponse, HttpMethod } from "../service/http/types";
import { parseDashboard } from "../pages/dashboard/dashboard.schemas";
import {
 createDashboardService,
 DashboardApiError,
 dashboardErrorMessage,
} from "../pages/dashboard/dashboard.service";
import { DASHBOARD_VIEW_CLAIM } from "../pages/dashboard/dashboard.types";

const dashboardPayload = {
 title: "Painel ambiental",
 description: "Dados agregados do escopo atual.",
 generatedAt: "2026-07-23T12:00:00.000Z",
 widgets: [
  {
   id: "environmental-summary",
   kind: "metrics",
   title: "Gestao ambiental",
   columns: 4,
   items: [
    {
     id: "valid-licenses",
     label: "Licencas validas",
     value: "12",
     detail: "de 14 registros",
     tone: "emerald",
     icon: "check",
    },
   ],
  },
  {
   id: "recent-processes",
   kind: "processes",
   title: "Processos recentes",
   items: [
    {
     id: "process-1",
     process: "SEMAD 1/2026",
     subject: "Licenciamento",
     status: "Em andamento",
     dueDate: "31/07/2026",
     tone: "blue",
    },
   ],
  },
 ],
};

function response<T>(data: T, ok = true, httpStatus = 200): ApiResponse<T> {
 return {
  ok,
  status: ok ? "success" : "error",
  httpStatus,
  data: ok ? data : null,
  error: ok ? null : { code: httpStatus === 403 ? "FORBIDDEN" : "UNAVAILABLE", message: "Falha controlada" },
  notifications: [],
  headers: new Headers(),
  request: { url: "/dashboard", method: "GET" as HttpMethod, attempts: 1, retried: false },
 };
}

test("painel usa a claim funcional declarada no plano", () => {
 assert.deepEqual(DASHBOARD_VIEW_CLAIM, {
  claimType: "recurso.dashboard",
  claimValue: "visualizar",
 });
});

test("schema aceita widgets autorizados e agregados", () => {
 const parsed = parseDashboard(dashboardPayload);
 assert.equal(parsed.widgets.length, 2);
 assert.equal(parsed.widgets[0]?.kind, "metrics");
 assert.equal(parsed.generatedAt, "2026-07-23T12:00:00.000Z");
});

test("schema aceita painel vazio sem inventar dados locais", () => {
 const parsed = parseDashboard({ title: "Painel", widgets: [] });
 assert.deepEqual(parsed.widgets, []);
});

test("schema recusa widget desconhecido, icone invalido e ids duplicados", () => {
 assert.throws(
  () => parseDashboard({ title: "Painel", widgets: [{ id: "x", kind: "chart", items: [] }] }),
  /widget desconhecido/i,
 );
 assert.throws(
  () => parseDashboard({
   title: "Painel",
   widgets: [{ id: "x", kind: "metrics", items: [{ id: "m", label: "M", value: "1", icon: "firebase" }] }],
  }),
  /metric.icon/i,
 );
 assert.throws(
  () => parseDashboard({
   title: "Painel",
   widgets: [
    { id: "x", kind: "metrics", items: [] },
    { id: "x", kind: "tasks", title: "Tarefas", items: [] },
   ],
  }),
  /duplicado/i,
 );
});

test("service consulta somente GET /dashboard pelo cliente HTTP central", async () => {
 let receivedUrl = "";
 let receivedSignal: AbortSignal | undefined;
 const controller = new AbortController();
 const client = {
  get: async (url: string, config: { signal?: AbortSignal }) => {
   receivedUrl = url;
   receivedSignal = config.signal;
   return response(dashboardPayload);
  },
 } as unknown as HttpClient;

 const result = await createDashboardService(client).get(controller.signal);
 assert.equal(receivedUrl, "/dashboard");
 assert.equal(receivedSignal, controller.signal);
 assert.equal(result.title, "Painel ambiental");
});

test("service preserva 403 tipado e mensagens cobrem falhas previstas", async () => {
 const client = { get: async () => response(null, false, 403) } as unknown as HttpClient;
 await assert.rejects(() => createDashboardService(client).get(), (error: unknown) => {
  assert.ok(error instanceof DashboardApiError);
  assert.equal(error.httpStatus, 403);
  assert.equal(error.code, "FORBIDDEN");
  return true;
 });
 assert.match(dashboardErrorMessage(new DashboardApiError("", 401)), /sessao expirou/i);
 assert.match(dashboardErrorMessage(new DashboardApiError("", 403)), /permissao/i);
 assert.match(dashboardErrorMessage(new DashboardApiError("", 404)), /nao esta disponivel/i);
 assert.match(dashboardErrorMessage(new DashboardApiError("", 409)), /atualizados/i);
 assert.match(dashboardErrorMessage(new DashboardApiError("", 503)), /temporariamente indisponivel/i);
 assert.match(dashboardErrorMessage(new DashboardApiError("", 0)), /temporariamente indisponivel/i);
});
