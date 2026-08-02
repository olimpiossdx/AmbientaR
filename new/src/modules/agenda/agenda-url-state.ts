import type { CalendarEventFilters, CalendarEventStatus } from "./agenda.types";

const statuses = new Set<CalendarEventStatus>(["scheduled", "confirmed", "cancelled", "completed"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type AgendaUrlState = {
 filters: CalendarEventFilters;
 page: number;
 selectedDate?: string;
};

function positiveInteger(value: string | null): number {
 const parsed = Number(value);
 return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function validDate(value: string | null): string | undefined {
 if (!value || !datePattern.test(value)) return undefined;
 const [year, month, day] = value.split("-").map(Number);
 const date = new Date(year, month - 1, day);
 return date.getFullYear() === year
  && date.getMonth() === month - 1
  && date.getDate() === day
  ? value
  : undefined;
}

export function parseAgendaUrlState(search: string): AgendaUrlState {
 const params = new URLSearchParams(search);
 const rawStatus = params.get("status");
 const status = rawStatus && statuses.has(rawStatus as CalendarEventStatus)
  ? rawStatus as CalendarEventStatus
  : "all";
 return {
  filters: {
   search: params.get("q")?.trim() || undefined,
   status,
   startsFrom: validDate(params.get("from")),
   startsTo: validDate(params.get("to")),
  },
  page: positiveInteger(params.get("page")),
  selectedDate: validDate(params.get("date")),
 };
}

export function buildAgendaSearch(currentSearch: string, state: AgendaUrlState): string {
 const params = new URLSearchParams(currentSearch);
 const setOrDelete = (key: string, value?: string) => value ? params.set(key, value) : params.delete(key);
 setOrDelete("q", state.filters.search?.trim());
 setOrDelete("status", state.filters.status && state.filters.status !== "all" ? state.filters.status : undefined);
 setOrDelete("from", state.filters.startsFrom);
 setOrDelete("to", state.filters.startsTo);
 setOrDelete("date", state.selectedDate);
 if (state.page > 1) params.set("page", String(state.page));
 else params.delete("page");
 const result = params.toString();
 return result ? `?${result}` : "";
}

export function dateToUrlValue(date?: Date): string | undefined {
 if (!date || Number.isNaN(date.getTime())) return undefined;
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, "0");
 const day = String(date.getDate()).padStart(2, "0");
 return `${year}-${month}-${day}`;
}

export function urlValueToDate(value?: string): Date | undefined {
 const normalized = validDate(value ?? null);
 if (!normalized) return undefined;
 const [year, month, day] = normalized.split("-").map(Number);
 const date = new Date(year, month - 1, day);
 return date;
}
