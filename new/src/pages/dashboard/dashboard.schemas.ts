import type {
 DashboardDto,
 DashboardHubItem,
 DashboardIcon,
 DashboardMetric,
 DashboardProcess,
 DashboardTask,
 DashboardTone,
 DashboardWidget,
} from "./dashboard.types";

const tones = new Set<DashboardTone>(["emerald", "amber", "red", "blue", "slate"]);
const icons = new Set<DashboardIcon>([
 "alert", "calendar", "check", "clock", "credit-card", "file-search", "folder",
 "line-chart", "recycle", "shield", "trending-up", "users", "wallet", "waves",
]);

function record(value: unknown, context: string): Record<string, unknown> {
 if (!value || typeof value !== "object" || Array.isArray(value)) {
  throw new Error(`Contrato invalido do painel: ${context}`);
 }
 return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
 if (typeof value !== "string" || value.trim() === "") {
  throw new Error(`Contrato invalido do painel: ${field}`);
 }
 return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
 if (value === undefined || value === null) return undefined;
 if (typeof value !== "string") throw new Error(`Contrato invalido do painel: ${field}`);
 const text = value.trim();
 return text || undefined;
}

function tone(value: unknown, field: string): DashboardTone | undefined {
 if (value === undefined || value === null) return undefined;
 if (typeof value !== "string" || !tones.has(value as DashboardTone)) {
  throw new Error(`Contrato invalido do painel: ${field}`);
 }
 return value as DashboardTone;
}

function icon(value: unknown, field: string): DashboardIcon | undefined {
 if (value === undefined || value === null) return undefined;
 if (typeof value !== "string" || !icons.has(value as DashboardIcon)) {
  throw new Error(`Contrato invalido do painel: ${field}`);
 }
 return value as DashboardIcon;
}

function array(value: unknown, field: string): unknown[] {
 if (!Array.isArray(value)) throw new Error(`Contrato invalido do painel: ${field}`);
 return value;
}

function metric(value: unknown, index: number): DashboardMetric {
 const item = record(value, `widgets.items[${index}]`);
 return {
  id: requiredString(item.id, "metric.id"),
  label: requiredString(item.label, "metric.label"),
  value: requiredString(item.value, "metric.value"),
  detail: optionalString(item.detail, "metric.detail"),
  tone: tone(item.tone, "metric.tone"),
  icon: icon(item.icon, "metric.icon"),
 };
}

function task(value: unknown, index: number): DashboardTask {
 const item = record(value, `widgets.items[${index}]`);
 return {
  id: requiredString(item.id, "task.id"),
  title: requiredString(item.title, "task.title"),
  detail: optionalString(item.detail, "task.detail"),
  status: optionalString(item.status, "task.status"),
 };
}

function process(value: unknown, index: number): DashboardProcess {
 const item = record(value, `widgets.items[${index}]`);
 return {
  id: requiredString(item.id, "process.id"),
  process: requiredString(item.process, "process.process"),
  subject: requiredString(item.subject, "process.subject"),
  status: requiredString(item.status, "process.status"),
  dueDate: requiredString(item.dueDate, "process.dueDate"),
  tone: tone(item.tone, "process.tone"),
 };
}

function hubItem(value: unknown, index: number): DashboardHubItem {
 const item = record(value, `widgets.items[${index}]`);
 return {
  id: requiredString(item.id, "hub.id"),
  label: requiredString(item.label, "hub.label"),
  detail: optionalString(item.detail, "hub.detail"),
  icon: icon(item.icon, "hub.icon"),
 };
}

function widget(value: unknown, index: number): DashboardWidget {
 const item = record(value, `widgets[${index}]`);
 const id = requiredString(item.id, `widgets[${index}].id`);
 const kind = requiredString(item.kind, `widgets[${index}].kind`);
 const items = array(item.items, `widgets[${index}].items`);

 if (kind === "metrics") {
  if (item.columns !== undefined && item.columns !== 3 && item.columns !== 4) {
   throw new Error("Contrato invalido do painel: metrics.columns");
  }
  return {
   id, kind, title: optionalString(item.title, "metrics.title"),
   columns: item.columns as 3 | 4 | undefined,
   items: items.map(metric),
  };
 }
 if (kind === "tasks") {
  return {
   id, kind, title: requiredString(item.title, "tasks.title"),
   description: optionalString(item.description, "tasks.description"),
   emptyMessage: optionalString(item.emptyMessage, "tasks.emptyMessage"),
   items: items.map(task),
  };
 }
 if (kind === "processes") {
  return {
   id, kind, title: requiredString(item.title, "processes.title"),
   description: optionalString(item.description, "processes.description"),
   emptyMessage: optionalString(item.emptyMessage, "processes.emptyMessage"),
   items: items.map(process),
  };
 }
 if (kind === "hub") {
  return { id, kind, title: optionalString(item.title, "hub.title"), items: items.map(hubItem) };
 }
 throw new Error(`Contrato invalido do painel: widget desconhecido "${kind}"`);
}

export function parseDashboard(value: unknown): DashboardDto {
 const data = record(value, "resposta");
 const generatedAt = optionalString(data.generatedAt, "generatedAt");
 if (generatedAt && Number.isNaN(Date.parse(generatedAt))) {
  throw new Error("Contrato invalido do painel: generatedAt");
 }
 const widgets = array(data.widgets, "widgets").map(widget);
 const widgetIds = new Set(widgets.map((item) => item.id));
 if (widgetIds.size !== widgets.length) throw new Error("Contrato invalido do painel: widget.id duplicado");

 return {
  title: requiredString(data.title, "title"),
  description: optionalString(data.description, "description"),
  widgets,
  generatedAt,
 };
}
