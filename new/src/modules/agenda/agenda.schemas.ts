import type { CalendarEvent, CalendarEventFilters, CalendarEventInput, CalendarEventList, CalendarEventStatus } from "./agenda.types";

const statuses = new Set<CalendarEventStatus>(["scheduled", "confirmed", "cancelled", "completed"]);

function isRecord(value: unknown): value is Record<string, unknown> {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
 if (typeof value !== "string" || value.trim() === "") throw new Error(`Campo invalido: ${field}`);
 return value;
}

function nullableString(value: unknown, field: string): string | null {
 if (value === null || value === undefined) return null;
 if (typeof value !== "string") throw new Error(`Campo invalido: ${field}`);
 return value;
}

function isoDate(value: unknown, field: string): string {
 const text = requiredString(value, field);
 if (Number.isNaN(Date.parse(text))) throw new Error(`Data invalida: ${field}`);
 return text;
}

function status(value: unknown): CalendarEventStatus {
 if (typeof value !== "string" || !statuses.has(value as CalendarEventStatus)) {
  throw new Error("Status de evento invalido");
 }
 return value as CalendarEventStatus;
}

export function parseCalendarEvent(value: unknown): CalendarEvent {
 if (!isRecord(value)) throw new Error("Evento de calendario invalido");
 if (!Number.isSafeInteger(value.version) || (value.version as number) < 1) throw new Error("Versao de evento invalida");
 if (typeof value.canManage !== "boolean" || typeof value.canRespond !== "boolean") throw new Error("Permissoes de evento invalidas");
 if (!["appointment", "deadline", "audit"].includes(String(value.type))) throw new Error("Tipo de evento invalido");
 if (typeof value.allDay !== "boolean" || typeof value.isPublic !== "boolean") throw new Error("Indicadores de evento invalidos");
 if (Date.parse(isoDate(value.endsAt, "endsAt")) <= Date.parse(isoDate(value.startsAt, "startsAt"))) throw new Error("Periodo de evento invalido");
 const invitation = value.invitation;
 if (invitation != null && (!isRecord(invitation) || !["pending", "accepted", "declined", "tentative"].includes(String(invitation.response)))) throw new Error("Convite invalido");
 return {
  version: value.version as number,
  type: value.type as CalendarEvent["type"],
  canManage: value.canManage,
  canRespond: value.canRespond,
  invitation: isRecord(invitation) ? { response: invitation.response as "pending" | "accepted" | "declined" | "tentative", message: nullableString(invitation.message, "message"), comment: nullableString(invitation.comment, "comment") } : null,
  id: requiredString(value.id, "id"),
  title: requiredString(value.title, "title"),
  description: nullableString(value.description, "description"),
  startsAt: isoDate(value.startsAt, "startsAt"),
  endsAt: isoDate(value.endsAt, "endsAt"),
  allDay: value.allDay === true,
  status: status(value.status),
  location: nullableString(value.location, "location"),
  ownerId: requiredString(value.ownerId, "ownerId"),
  isPublic: value.isPublic === true,
  createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
  updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
 };
}

export function parseCalendarEventList(value: unknown, envelopeTotal?: number, page = 1, size = 10): CalendarEventList {
 const rawItems = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.items) ? value.items : null;
 if (!rawItems) throw new Error("Lista de eventos invalida");
 const items = rawItems.map(parseCalendarEvent);
 const total = typeof envelopeTotal === "number"
  ? envelopeTotal
  : isRecord(value) && typeof value.total === "number" ? value.total : items.length;
 return { items, total, page, size };
}

export function validateCalendarEventInput(value: CalendarEventInput): CalendarEventInput {
 const title = value.title.trim();
 if (title.length < 3 || title.length > 160) throw new Error("O titulo deve ter entre 3 e 160 caracteres.");
 const startsAt = isoDate(value.startsAt, "startsAt");
 const endsAt = isoDate(value.endsAt, "endsAt");
 if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error("O termino deve ser posterior ao inicio.");
 status(value.status);
 return { ...value, title, startsAt, endsAt };
}

export function validateCalendarEventFilters(value: CalendarEventFilters): CalendarEventFilters {
 if (value.startsFrom && !validDate(value.startsFrom)) throw new Error("Data inicial invalida.");
 if (value.startsTo && !validDate(value.startsTo)) throw new Error("Data final invalida.");
 if (value.startsFrom && value.startsTo && value.startsFrom > value.startsTo) {
  throw new Error("A data final do filtro deve ser igual ou posterior a data inicial.");
 }
 if (value.status && value.status !== "all") status(value.status);
 return value;
}

function validDate(value: string): boolean {
 return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function agendaDateBoundary(value: string | undefined, end = false): string | undefined {
 if (!value) return undefined;
 if (!validDate(value)) throw new Error("Data invalida.");
 const [year, month, day] = value.split("-").map(Number);
 return new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0).toISOString();
}
