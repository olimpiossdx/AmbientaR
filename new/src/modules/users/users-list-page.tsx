import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, ShieldX, Trash2, Users } from "lucide-react";
import { useClaim } from "../../app/authorization/use-claim";
import { Button, Card, CardContent, Input, PageHeader, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { AuthorizationGroupsPanel } from "./authorization-groups-panel";
import { UserFormDialog } from "./user-form-dialog";
import { getUsersTotalPages } from "./users-list-state";
import { UsersApiError, usersService } from "./users.service";
import { AUTHORIZATION_CLAIMS, USERS_CLAIMS, type UserInput, type UserListItem } from "./users.types";
import { useUsersList } from "./use-users-list";

const PAGE_SIZE = 10;
function actionError(error: unknown): string {
 if (error instanceof UsersApiError && error.httpStatus === 409) return "O registro foi alterado ou já existe. Atualize a listagem e tente novamente.";
 if (error instanceof UsersApiError && error.httpStatus === 403) return "Você não possui permissão para concluir esta ação.";
 return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

function UsersLoadingState() {
 return <Card aria-label="Carregando usuários" aria-busy="true"><CardContent className="space-y-3 p-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</CardContent></Card>;
}

export function UsersListPage() {
 const canCreate = useClaim(USERS_CLAIMS.create); const canEdit = useClaim(USERS_CLAIMS.edit); const canDelete = useClaim(USERS_CLAIMS.delete);
 const canViewGroups = useClaim(AUTHORIZATION_CLAIMS.viewGroups);
 const canViewClaims = useClaim(AUTHORIZATION_CLAIMS.viewClaims);
 const canSeeAuthorization = canViewGroups || canViewClaims;
 const [draftSearch, setDraftSearch] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
 const [editing, setEditing] = useState<UserListItem | "new" | null>(null); const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
 const [actionMessage, setActionMessage] = useState<string | null>(null);
 const { state, retry } = useUsersList(search, page, PAGE_SIZE);
 function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSearch(draftSearch.trim()); }
 async function openEdit(user: UserListItem) {
  setLoadingUserId(user.id); setActionMessage(null);
  try { setEditing(await usersService.get(user.id)); } catch (error) { setActionMessage(actionError(error)); }
  finally { setLoadingUserId(null); }
 }
 async function save(input: UserInput) {
  if (editing === "new") await usersService.create(input);
  else if (editing) await usersService.update(editing.id, input);
  retry();
 }
 async function remove(user: UserListItem) {
  if (!globalThis.confirm(`Excluir o usuário “${user.nome}”?`)) return;
  setActionMessage(null);
  try {
   await usersService.remove(user.id);
   if (state.status === "ready" && state.page.items.length === 1 && page > 1) setPage((current) => current - 1);
   else retry();
  } catch (error) { setActionMessage(actionError(error)); }
 }

 const usersContent = <div className="space-y-5">
  <Card><CardContent className="p-4 sm:p-5"><form className="flex flex-col gap-3 sm:flex-row" role="search" onSubmit={submitSearch}><div className="min-w-0 flex-1"><Input name="users-search" aria-label="Buscar usuários" placeholder="Buscar por nome, CPF/CNPJ ou telefone" value={draftSearch} onChange={(event) => setDraftSearch(event.currentTarget.value)} /></div><Button type="submit" leftIcon={<Search size={16} />}>Buscar</Button>{canCreate ? <Button type="button" leftIcon={<Plus size={16} />} onClick={() => setEditing("new")}>Novo usuário</Button> : null}</form></CardContent></Card>
  {actionMessage ? <Alert variant="error" title="Ação não concluída" onClose={() => setActionMessage(null)}>{actionMessage}</Alert> : null}
  {state.status === "loading" ? <UsersLoadingState /> : null}
  {state.status === "forbidden" ? <Alert variant="warning" title="Acesso não autorizado" icon={<ShieldX size={20} />}>{state.message}</Alert> : null}
  {state.status === "error" ? <Alert variant="error" title="Falha ao carregar usuários"><div className="flex flex-col items-start gap-3"><span>{state.message}</span><Button size="sm" variant="outline" onClick={retry}>Tentar novamente</Button></div></Alert> : null}
  {state.status === "empty" ? <Card><CardContent className="flex flex-col items-center gap-2 px-5 py-12 text-center"><Users className="text-slate-400" size={38} aria-hidden="true" /><h2 className="font-semibold text-slate-900">Nenhum usuário encontrado</h2><p className="text-sm text-slate-600">{search ? `Não há resultados para “${search}”. Ajuste a busca e tente novamente.` : "Ainda não há usuários cadastrados."}</p>{canCreate && !search ? <Button className="mt-2" leftIcon={<Plus size={16} />} onClick={() => setEditing("new")}>Cadastrar primeiro usuário</Button> : null}</CardContent></Card> : null}
  {state.status === "ready" ? <Card><CardContent className="p-0"><Table aria-label="Lista de usuários"><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Contato</TableHead><TableHead>Tipo</TableHead><TableHead>Localidade</TableHead>{canEdit || canDelete ? <TableHead className="text-right">Ações</TableHead> : null}</TableRow></TableHeader><TableBody>{state.page.items.map((user) => <TableRow key={user.id}><TableCell><div className="font-medium text-slate-900">{user.nome}</div><div className="text-xs text-slate-500">{user.email}</div></TableCell><TableCell>{user.cpfCnpj}</TableCell><TableCell>{user.telefone}</TableCell><TableCell>{user.entityType || user.tipo}</TableCell><TableCell>{[user.municipio, user.uf].filter(Boolean).join(" / ") || "—"}</TableCell>{canEdit || canDelete ? <TableCell><div className="flex justify-end gap-2">{canEdit ? <Button size="icon" variant="outline" isLoading={loadingUserId === user.id} aria-label={`Editar ${user.nome}`} onClick={() => void openEdit(user)}><Pencil size={16} /></Button> : null}{canDelete ? <Button size="icon" variant="destructive" aria-label={`Excluir ${user.nome}`} onClick={() => void remove(user)}><Trash2 size={16} /></Button> : null}</div></TableCell> : null}</TableRow>)}</TableBody></Table></CardContent><div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>{state.page.total} usuário(s) encontrado(s)</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} leftIcon={<ChevronLeft size={16} />}>Anterior</Button><span>Página {page} de {getUsersTotalPages(state.page.total, state.page.size)}</span><Button size="sm" variant="outline" aria-label="Próxima página" disabled={page >= getUsersTotalPages(state.page.total, state.page.size)} onClick={() => setPage((current) => current + 1)} rightIcon={<ChevronRight size={16} />}>Próxima</Button></div></div></Card> : null}
  {editing ? <UserFormDialog key={editing === "new" ? "new" : editing.id} open user={editing === "new" ? undefined : editing} onOpenChange={(open) => { if (!open) setEditing(null); }} onSave={save} /> : null}
 </div>;

 const items = [{ value: "users", label: "Usuários", content: usersContent }];
 if (canSeeAuthorization) items.push({ value: "authorization", label: "Grupos e claims", content: <AuthorizationGroupsPanel /> });
 return <div className="min-h-full bg-slate-100"><PageHeader eyebrow="Cadastro" title="Usuários" description="Administre usuários, grupos e permissões conforme suas claims." /><main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><Tabs items={items} defaultValue="users" /></main></div>;
}
