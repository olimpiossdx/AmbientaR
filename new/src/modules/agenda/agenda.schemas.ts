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
 return {
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
 if (value.startsFrom && Number.isNaN(Date.parse(`${value.startsFrom}T00:00:00`))) throw new Error("Data inicial invalida.");
 if (value.startsTo && Number.isNaN(Date.parse(`${value.startsTo}T23:59:59`))) throw new Error("Data final invalida.");
 if (value.startsFrom && value.startsTo && value.startsFrom > value.startsTo) {
  throw new Error("A data final do filtro deve ser igual ou posterior a data inicial.");
 }
 if (value.status && value.status !== "all") status(value.status);
 return value;
}
