import React from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, HelpCircle, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, UserPlus, X } from "lucide-react";
import { useClaim } from "../../app/authorization/use-claim";
import {
 Badge, Button, Calendar, Card, CardContent, CardHeader, CardTitle,
 Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
 Input, PageHeader, Select, Skeleton, Textarea,
} from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { AgendaApiError, agendaService, isAgendaAbortError } from "./agenda.service";
import type { CalendarEvent, CalendarEventFilters, CalendarEventInput, CalendarEventInviteInput, CalendarEventResponse, CalendarEventStatus } from "./agenda.types";
import { AGENDA_CLAIMS } from "./agenda.types";
import { buildAgendaSearch, dateToUrlValue, parseAgendaUrlState, urlValueToDate } from "./agenda-url-state";

const statusLabels: Record<CalendarEventStatus, string> = {
 scheduled: "Agendado", confirmed: "Confirmado", cancelled: "Cancelado", completed: "Concluido",
};
const statusVariants: Record<CalendarEventStatus, "outline" | "success" | "error" | "secondary"> = {
 scheduled: "outline", confirmed: "success", cancelled: "error", completed: "secondary",
};
const PAGE_SIZE = 10;

function totalPages(total: number): number {
 return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

function localDateTime(iso?: string): string {
 const date = iso ? new Date(iso) : new Date();
 const offset = date.getTimezoneOffset() * 60_000;
 return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialInput(event?: CalendarEvent): CalendarEventInput {
 const startsAt = event?.startsAt ?? new Date().toISOString();
 const defaultEnd = new Date(Date.parse(startsAt) + 60 * 60_000).toISOString();
 return {
  title: event?.title ?? "",
  description: event?.description ?? "",
  startsAt: localDateTime(startsAt),
  endsAt: localDateTime(event?.endsAt ?? defaultEnd),
  allDay: event?.allDay ?? false,
  status: event?.status ?? "scheduled",
  location: event?.location ?? "",
  isPublic: event?.isPublic ?? false,
 };
}

function EventForm({ event, saving, onCancel, onSubmit }: {
 event?: CalendarEvent; saving: boolean; onCancel: () => void; onSubmit: (input: CalendarEventInput) => Promise<void>;
}) {
 const [input, setInput] = React.useState<CalendarEventInput>(() => initialInput(event));
 const [validation, setValidation] = React.useState<string | null>(null);
 const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setValidation(null);
  try {
   await onSubmit({ ...input, startsAt: new Date(input.startsAt).toISOString(), endsAt: new Date(input.endsAt).toISOString() });
  } catch (error) {
   setValidation(error instanceof Error ? error.message : "Revise os campos informados.");
  }
 };
 return <form onSubmit={submit} className="space-y-4">
  {validation ? <Alert variant="error" title="Nao foi possivel salvar">{validation}</Alert> : null}
  <Input name="event-title" label="Titulo" required maxLength={160} value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} />
  <Textarea label="Descricao" rows={3} value={input.description ?? ""} onChange={(e) => setInput({ ...input, description: e.target.value })} />
  <div className="grid gap-4 sm:grid-cols-2">
   <Input name="event-start" label="Inicio" type="datetime-local" required value={input.startsAt} onChange={(e) => setInput({ ...input, startsAt: e.target.value })} />
   <Input name="event-end" label="Termino" type="datetime-local" required value={input.endsAt} onChange={(e) => setInput({ ...input, endsAt: e.target.value })} />
  </div>
  <div className="grid gap-4 sm:grid-cols-2">
   <Select name="event-status" label="Status" value={input.status} onChange={(e) => setInput({ ...input, status: e.target.value as CalendarEventStatus })}>
    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
   </Select>
   <Input name="event-location" label="Local" value={input.location ?? ""} onChange={(e) => setInput({ ...input, location: e.target.value })} />
  </div>
  <div className="flex flex-wrap gap-5">
   <Input name="event-all-day" type="checkbox" label="Dia inteiro" checked={input.allDay} onChange={(e) => setInput({ ...input, allDay: e.target.checked })} />
   <Input name="event-public" type="checkbox" label="Evento publico" checked={input.isPublic} onChange={(e) => setInput({ ...input, isPublic: e.target.checked })} />
  </div>
  <DialogFooter>
   <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
   <Button type="submit" isLoading={saving}>{event ? "Salvar alteracoes" : "Criar evento"}</Button>
  </DialogFooter>
 </form>;
}

function InviteForm({ saving, onCancel, onSubmit }: {
 saving: boolean; onCancel: () => void; onSubmit: (input: CalendarEventInviteInput) => Promise<void>;
}) {
 const [userIds, setUserIds] = React.useState("");
 const [message, setMessage] = React.useState("");
 const [validation, setValidation] = React.useState<string | null>(null);
 const submit = async (event: React.FormEvent) => {
  event.preventDefault();
  setValidation(null);
  try {
   await onSubmit({ userIds: userIds.split(","), message: message.trim() || null });
  } catch (error) {
   setValidation(error instanceof Error ? error.message : "Nao foi possivel enviar os convites.");
  }
 };
 return <form onSubmit={submit} className="space-y-4">
  {validation ? <Alert variant="error" title="Convite nao enviado">{validation}</Alert> : null}
  <Input name="invite-user-ids" label="IDs dos usuarios" required placeholder="usuario-1, usuario-2" helperText="Separe varios IDs por virgula." value={userIds} onChange={(event) => setUserIds(event.currentTarget.value)} />
  <Textarea label="Mensagem opcional" rows={3} value={message} onChange={(event) => setMessage(event.currentTarget.value)} />
  <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" isLoading={saving}>Enviar convites</Button></DialogFooter>
 </form>;
}

function LoadingState() {
 return <div aria-label="Carregando agenda" className="space-y-3">
  {[0, 1, 2].map((item) => <Skeleton key={item} className="h-24 w-full" />)}
 </div>;
}

export function AgendaPage() {
 const initialUrlState = React.useMemo(
  () => parseAgendaUrlState(typeof window === "undefined" ? "" : window.location.search),
  [],
 );
 const canView = useClaim(AGENDA_CLAIMS.view);
 const canCreate = useClaim(AGENDA_CLAIMS.create);
 const canUpdate = useClaim(AGENDA_CLAIMS.update);
 const canDelete = useClaim(AGENDA_CLAIMS.delete);
 const canInvite = useClaim(AGENDA_CLAIMS.invite);
 const canRespond = useClaim(AGENDA_CLAIMS.respond);
 const [events, setEvents] = React.useState<CalendarEvent[]>([]);
 const [filters, setFilters] = React.useState<CalendarEventFilters>(initialUrlState.filters);
 const [page, setPage] = React.useState(initialUrlState.page);
 const [total, setTotal] = React.useState(0);
 const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => urlValueToDate(initialUrlState.selectedDate));
 const [loading, setLoading] = React.useState(true);
 const [saving, setSaving] = React.useState(false);
 const [error, setError] = React.useState<string | null>(null);
 const [actionError, setActionError] = React.useState<string | null>(null);
 const [forbidden, setForbidden] = React.useState(false);
 const [editing, setEditing] = React.useState<CalendarEvent | "new" | null>(null);
 const [inviting, setInviting] = React.useState<CalendarEvent | null>(null);
 const [pendingAction, setPendingAction] = React.useState<string | null>(null);
 const requestRevision = React.useRef(0);

 const load = React.useCallback(async (signal?: AbortSignal) => {
  const requestId = ++requestRevision.current;
  if (!canView) { setForbidden(true); setLoading(false); return; }
  setLoading(true); setError(null); setForbidden(false);
  try {
   const result = await agendaService.list({ ...filters, page, size: PAGE_SIZE }, signal);
   if (signal?.aborted || requestId !== requestRevision.current) return;
   const lastPage = Math.max(1, Math.ceil(result.total / result.size));
   if (page > lastPage) {
    setPage(lastPage);
    return;
   }
   setEvents(result.items);
   setTotal(result.total);
  } catch (caught) {
   if (signal?.aborted || requestId !== requestRevision.current || isAgendaAbortError(caught)) return;
   if (caught instanceof AgendaApiError && caught.httpStatus === 403) setForbidden(true);
   else setError(caught instanceof Error ? caught.message : "Nao foi possivel carregar a agenda.");
  } finally {
   if (!signal?.aborted && requestId === requestRevision.current) setLoading(false);
  }
 }, [canView, filters, page]);

 React.useEffect(() => {
  const controller = new AbortController();
  void load(controller.signal);
  return () => controller.abort();
 }, [load]);

 React.useEffect(() => {
  if (typeof window === "undefined") return;
  const search = buildAgendaSearch(window.location.search, {
   filters,
   page,
   selectedDate: dateToUrlValue(selectedDate),
  });
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
 }, [filters, page, selectedDate]);

 const visibleEvents = React.useMemo(() => {
  if (!selectedDate) return events;
  return events.filter((event) => new Date(event.startsAt).toDateString() === selectedDate.toDateString());
 }, [events, selectedDate]);

 const save = async (input: CalendarEventInput) => {
  setSaving(true);
  setActionError(null);
  try {
   if (editing === "new") await agendaService.create(input);
   else if (editing) await agendaService.update(editing.id, input);
   setEditing(null);
   await load();
  } catch (caught) {
   setActionError(caught instanceof AgendaApiError && caught.httpStatus === 403
    ? "Voce nao possui permissao para salvar este evento. A agenda carregada foi preservada."
    : caught instanceof Error ? caught.message : "Nao foi possivel salvar o evento.");
   throw caught;
  } finally { setSaving(false); }
 };

 const remove = async (event: CalendarEvent) => {
  if (!globalThis.confirm(`Excluir o evento "${event.title}"?`)) return;
  setError(null);
  setActionError(null);
  try { await agendaService.remove(event.id); await load(); }
  catch (caught) {
   setActionError(caught instanceof AgendaApiError && caught.httpStatus === 403
    ? "Voce nao possui permissao para excluir este evento. A agenda carregada foi preservada."
    : caught instanceof Error ? caught.message : "Nao foi possivel excluir o evento.");
  }
 };

 const invite = async (input: CalendarEventInviteInput) => {
  if (!inviting) return;
  setSaving(true); setActionError(null);
  try { await agendaService.invite(inviting.id, input); setInviting(null); await load(); }
  catch (caught) {
   setActionError(caught instanceof AgendaApiError && caught.httpStatus === 403
    ? "Voce nao possui permissao para convidar neste evento. A agenda carregada foi preservada."
    : caught instanceof Error ? caught.message : "Nao foi possivel enviar os convites.");
   throw caught;
  } finally { setSaving(false); }
 };

 const respond = async (event: CalendarEvent, response: CalendarEventResponse) => {
  const actionId = `${event.id}:${response}`;
  setPendingAction(actionId); setActionError(null);
  try { await agendaService.respond(event.id, { response }); await load(); }
  catch (caught) {
   setActionError(caught instanceof AgendaApiError && caught.httpStatus === 403
    ? "Voce nao pode responder a este convite. A agenda carregada foi preservada."
    : caught instanceof Error ? caught.message : "Nao foi possivel responder ao convite.");
  } finally { setPendingAction(null); }
 };

 if (forbidden || !canView) return <main className="mx-auto max-w-3xl p-4 sm:p-8"><Alert variant="error" title="Acesso negado">Voce nao possui a claim recurso.agenda=visualizar ou nao tem acesso ao escopo solicitado.</Alert></main>;

 return <div className="min-h-full bg-slate-50">
  <PageHeader eyebrow="Organizacao" title="Agenda" description="Consulte e organize compromissos conforme seu escopo de acesso."
   actions={canCreate ? <Button leftIcon={<Plus size={16} />} onClick={() => setEditing("new")}>Novo evento</Button> : null} />
  <main className="mx-auto grid w-full max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:p-8">
   <aside className="space-y-4">
    <Card><CardHeader><CardTitle className="text-base">Calendario</CardTitle></CardHeader><CardContent>
     <Calendar value={selectedDate} onValueChange={(date) => { setPage(1); setSelectedDate(date); }} className="w-full border-0 p-0 shadow-none" />
     {selectedDate ? <Button className="mt-3" size="sm" variant="ghost" onClick={() => setSelectedDate(undefined)}>Mostrar todos os dias</Button> : null}
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader><CardContent className="space-y-3">
     <Input name="agenda-search" label="Buscar" placeholder="Titulo, descricao ou local" leftIcon={<Search size={16} />} value={filters.search ?? ""} onChange={(e) => { setPage(1); setFilters({ ...filters, search: e.target.value }); }} />
     <Select name="agenda-status" label="Status" value={filters.status ?? "all"} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value as CalendarEventFilters["status"] }); }}>
      <option value="all">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
     </Select>
     <div className="grid grid-cols-2 gap-2">
      <Input name="agenda-from" label="De" type="date" value={filters.startsFrom ?? ""} onChange={(e) => { setPage(1); setFilters({ ...filters, startsFrom: e.target.value }); }} />
      <Input name="agenda-to" label="Ate" type="date" value={filters.startsTo ?? ""} onChange={(e) => { setPage(1); setFilters({ ...filters, startsTo: e.target.value }); }} />
     </div>
    </CardContent></Card>
   </aside>
   <section aria-live="polite" className="min-w-0 space-y-4">
    <div className="flex items-center justify-between gap-3">
     <div><h2 className="text-lg font-semibold text-slate-950">Compromissos</h2><p className="text-sm text-slate-600">{selectedDate ? selectedDate.toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Todos os eventos do periodo"}</p></div>
     <Button size="icon" variant="outline" aria-label="Atualizar agenda" disabled={loading} onClick={() => void load()}><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></Button>
    </div>
    {error ? <Alert variant="error" title="Falha ao carregar" onClose={() => setError(null)}>{error}</Alert> : null}
    {actionError ? <Alert variant="warning" title="Acao nao concluida" onClose={() => setActionError(null)}>{actionError}</Alert> : null}
    {loading ? <LoadingState /> : visibleEvents.length === 0 ? <Card><CardContent className="flex min-h-52 flex-col items-center justify-center text-center"><CalendarDays className="mb-3 text-slate-400" size={36} /><h3 className="font-semibold">Nenhum evento encontrado</h3><p className="mt-1 text-sm text-slate-600">Ajuste os filtros ou selecione outra data.</p></CardContent></Card> :
     <div className="space-y-3">{visibleEvents.map((event) => <Card key={event.id}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{event.title}</h3><Badge variant={statusVariants[event.status]}>{statusLabels[event.status]}</Badge>{event.isPublic ? <Badge variant="outline">Publico</Badge> : null}</div>
       {event.description ? <p className="text-sm text-slate-600">{event.description}</p> : null}
       <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><Clock3 size={14} />{new Date(event.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: event.allDay ? undefined : "short" })}</span>{event.location ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{event.location}</span> : null}</div>
      </div>
      {(canUpdate || canDelete || canInvite || canRespond) ? <div className="flex max-w-72 shrink-0 flex-wrap justify-end gap-2">
       {canRespond ? <><Button size="icon" variant="outline" aria-label={`Aceitar convite ${event.title}`} isLoading={pendingAction === `${event.id}:accepted`} onClick={() => void respond(event, "accepted")}><Check size={16} /></Button><Button size="icon" variant="outline" aria-label={`Marcar talvez ${event.title}`} isLoading={pendingAction === `${event.id}:tentative`} onClick={() => void respond(event, "tentative")}><HelpCircle size={16} /></Button><Button size="icon" variant="outline" aria-label={`Recusar convite ${event.title}`} isLoading={pendingAction === `${event.id}:declined`} onClick={() => void respond(event, "declined")}><X size={16} /></Button></> : null}
       {canInvite ? <Button size="icon" variant="outline" aria-label={`Convidar para ${event.title}`} onClick={() => setInviting(event)}><UserPlus size={16} /></Button> : null}
       {canUpdate ? <Button size="icon" variant="outline" aria-label={`Editar ${event.title}`} onClick={() => setEditing(event)}><Pencil size={16} /></Button> : null}{canDelete ? <Button size="icon" variant="destructive" aria-label={`Excluir ${event.title}`} onClick={() => void remove(event)}><Trash2 size={16} /></Button> : null}
      </div> : null}
     </CardContent></Card>)}</div>}
    {!loading && total > 0 ? <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
     <span>{total} evento(s)</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" leftIcon={<ChevronLeft size={16} />} disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><span>Pagina {page} de {totalPages(total)}</span><Button size="sm" variant="outline" rightIcon={<ChevronRight size={16} />} disabled={page >= totalPages(total)} onClick={() => setPage((current) => current + 1)}>Proxima</Button></div>
    </div> : null}
   </section>
  </main>
  <Dialog open={editing !== null} onOpenChange={(open) => { if (!open && !saving) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>{editing === "new" ? "Novo evento" : "Editar evento"}</DialogTitle><DialogDescription>Informe os dados do compromisso. As regras de escopo serao validadas pela API.</DialogDescription></DialogHeader>{editing ? <EventForm key={editing === "new" ? "new" : editing.id} event={editing === "new" ? undefined : editing} saving={saving} onCancel={() => setEditing(null)} onSubmit={save} /> : null}</DialogContent></Dialog>
  <Dialog open={inviting !== null} onOpenChange={(open) => { if (!open && !saving) setInviting(null); }}><DialogContent><DialogHeader><DialogTitle>Convidar para o evento</DialogTitle><DialogDescription>{inviting ? `Selecione os participantes de ${inviting.title}.` : "Informe os participantes."}</DialogDescription></DialogHeader>{inviting ? <InviteForm key={inviting.id} saving={saving} onCancel={() => setInviting(null)} onSubmit={invite} /> : null}</DialogContent></Dialog>
 </div>;
}
