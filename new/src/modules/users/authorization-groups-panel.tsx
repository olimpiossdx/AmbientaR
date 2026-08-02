import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useClaim } from "../../app/authorization/use-claim";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { UsersApiError, usersService } from "./users.service";
import { AUTHORIZATION_CLAIMS, type AuthorizationClaim, type AuthorizationGroup, type UserListItem } from "./users.types";

function mutationError(error: unknown): string {
 if (error instanceof UsersApiError && error.httpStatus === 409) return "Este grupo foi alterado por outra pessoa. Recarregue os dados antes de tentar novamente.";
 if (error instanceof UsersApiError && error.httpStatus === 403) return "Você não possui a claim exigida para esta ação.";
 return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function GroupDialog({ group, claims, users, canEditDetails, canLinkClaims, canLinkUsers, onClose, onSaved }: {
 group: AuthorizationGroup | "new"; claims: AuthorizationClaim[]; users: UserListItem[]; canEditDetails: boolean; canLinkClaims: boolean; canLinkUsers: boolean;
 onClose: () => void; onSaved: () => void;
}) {
 const current = group === "new" ? undefined : group;
 const [name, setName] = useState(current?.name ?? "");
 const [description, setDescription] = useState(current?.description ?? "");
 const [claimIds, setClaimIds] = useState<string[]>(current?.claimIds ?? []);
 const [userIds, setUserIds] = useState<string[]>([]);
 const [initialUserIds, setInitialUserIds] = useState<string[]>([]);
 const [loadingUsers, setLoadingUsers] = useState(Boolean(current && canLinkUsers));
 const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
 const toggle = (id: string) => setClaimIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
 const toggleUser = (id: string) => setUserIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
 useEffect(() => {
  if (!current || !canLinkUsers) return;
  const controller = new AbortController();
  void usersService.listGroupUserIds(current.id, controller.signal)
   .then((ids) => { if (!controller.signal.aborted) { setUserIds(ids); setInitialUserIds(ids); } })
   .catch((caught: unknown) => { if (!controller.signal.aborted) setError(mutationError(caught)); })
   .finally(() => { if (!controller.signal.aborted) setLoadingUsers(false); });
  return () => controller.abort();
 }, [canLinkUsers, current]);
 async function submit(event: FormEvent) {
  event.preventDefault(); setSaving(true); setError(null);
  try {
   if (!current) {
    let created = await usersService.createGroup({ name, description, claimIds: canLinkClaims ? claimIds : [] });
    if (canLinkUsers && userIds.length) created = await usersService.replaceGroupUsers(created.id, created.version, userIds);
    void created;
   }
   else {
    let updated = current;
    if (canEditDetails) updated = await usersService.updateGroup(current.id, current.version, { name, description });
    const changedClaims = [...claimIds].sort().join() !== [...current.claimIds].sort().join();
    if (canLinkClaims && changedClaims) updated = await usersService.replaceGroupClaims(current.id, updated.version, claimIds);
    const changedUsers = [...userIds].sort().join() !== [...initialUserIds].sort().join();
    if (canLinkUsers && changedUsers) await usersService.replaceGroupUsers(current.id, updated.version, userIds);
   }
   onSaved();
  } catch (caught) { setError(mutationError(caught)); }
  finally { setSaving(false); }
 }
 return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent className="max-w-2xl">
  <DialogHeader><DialogTitle>{current ? "Editar grupo" : "Novo grupo"}</DialogTitle><DialogDescription>Alterações usam a versão atual do grupo para evitar sobrescrita concorrente.</DialogDescription></DialogHeader>
  <form onSubmit={submit} className="space-y-4">
   {error ? <Alert variant="error">{error}</Alert> : null}
   <Input name="group-name" label="Nome" required disabled={Boolean(current) && !canEditDetails} value={name} onChange={(e) => setName(e.target.value)} />
   <Textarea name="group-description" label="Descrição" disabled={Boolean(current) && !canEditDetails} value={description} onChange={(e) => setDescription(e.target.value)} />
   <fieldset disabled={!canLinkClaims} className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-3">
    <legend className="px-1 text-sm font-semibold">Claims do grupo</legend>
    {claims.length === 0 ? <p className="text-sm text-slate-500">Catálogo indisponível ou vazio.</p> : claims.map((claim) => <label key={claim.id} className="flex items-center gap-2 border-b border-slate-100 py-2 text-sm last:border-0"><input type="checkbox" checked={claimIds.includes(claim.id)} onChange={() => toggle(claim.id)} /><span className="font-mono text-xs">{claim.type}={claim.value}</span></label>)}
   </fieldset>
   {canLinkUsers ? <fieldset disabled={loadingUsers} className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 p-3">
    <legend className="px-1 text-sm font-semibold">Usuários vinculados</legend>
    {loadingUsers ? <p className="text-sm text-slate-500">Carregando vínculos…</p> : users.length === 0 ? <p className="text-sm text-slate-500">Nenhum usuário disponível.</p> : users.map((user) => <label key={user.id} className="flex items-center gap-2 border-b border-slate-100 py-2 text-sm last:border-0"><input type="checkbox" checked={userIds.includes(user.id)} onChange={() => toggleUser(user.id)} /><span>{user.nome}</span><span className="text-xs text-slate-500">{user.email}</span></label>)}
   </fieldset> : null}
   <DialogFooter><Button variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" isLoading={saving}>Salvar grupo</Button></DialogFooter>
  </form>
 </DialogContent></Dialog>;
}

export function AuthorizationGroupsPanel() {
 const canViewGroups = useClaim(AUTHORIZATION_CLAIMS.viewGroups); const canViewClaims = useClaim(AUTHORIZATION_CLAIMS.viewClaims);
 const canCreate = useClaim(AUTHORIZATION_CLAIMS.createGroup); const canEdit = useClaim(AUTHORIZATION_CLAIMS.editGroup);
 const canDelete = useClaim(AUTHORIZATION_CLAIMS.deleteGroup); const canLinkClaims = useClaim(AUTHORIZATION_CLAIMS.linkClaim);
 const canLinkUsers = useClaim(AUTHORIZATION_CLAIMS.linkUser);
 const [groups, setGroups] = useState<AuthorizationGroup[]>([]); const [claims, setClaims] = useState<AuthorizationClaim[]>([]);
 const [users, setUsers] = useState<UserListItem[]>([]);
 const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
 const [editing, setEditing] = useState<AuthorizationGroup | "new" | null>(null); const [revision, setRevision] = useState(0);
 useEffect(() => {
  const controller = new AbortController(); setLoading(true); setError(null);
  const jobs: Promise<void>[] = [];
  if (canViewGroups) jobs.push(usersService.listGroups(controller.signal).then(setGroups));
  if (canViewClaims) jobs.push(usersService.listClaims(controller.signal).then(setClaims));
  if (canLinkUsers) jobs.push(usersService.listUsersForGroups(controller.signal).then(setUsers));
  void Promise.all(jobs).catch((caught: unknown) => { if (!controller.signal.aborted) setError(mutationError(caught)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [canLinkUsers, canViewClaims, canViewGroups, revision]);
 const claimsById = useMemo(() => new Map(claims.map((claim) => [claim.id, claim])), [claims]);
 async function remove(group: AuthorizationGroup) {
  if (!globalThis.confirm(`Excluir o grupo “${group.name}”?`)) return;
  setError(null); try { await usersService.deleteGroup(group.id, group.version); setRevision((value) => value + 1); }
  catch (caught) { setError(mutationError(caught)); }
 }
 if (!canViewGroups && !canViewClaims) return <Alert variant="warning" title="Acesso restrito">Você não possui permissão para visualizar grupos ou o catálogo de claims.</Alert>;
 return <div className="space-y-5">
  <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" leftIcon={<RefreshCw size={16} />} onClick={() => setRevision((v) => v + 1)}>Atualizar</Button>{canViewGroups && canCreate ? <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setEditing("new")}>Novo grupo</Button> : null}</div>
  {error ? <Alert variant="error" title="Falha na autorização">{error}</Alert> : null}
  {loading ? <Skeleton className="h-48 w-full" /> : null}
  {!loading && canViewGroups ? <Card><CardHeader><CardTitle className="text-base">Grupos de autorização</CardTitle></CardHeader><CardContent className="p-0"><Table aria-label="Grupos de autorização"><TableHeader><TableRow><TableHead>Grupo</TableHead><TableHead>Claims</TableHead><TableHead>Versão</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
   {groups.length === 0 ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-500">Nenhum grupo cadastrado.</TableCell></TableRow> : groups.map((group) => <TableRow key={group.id}><TableCell><div className="font-medium">{group.name}</div><div className="text-xs text-slate-500">{group.description || "Sem descrição"}</div></TableCell><TableCell><div className="flex max-w-xl flex-wrap gap-1">{group.claimIds.length ? group.claimIds.map((id) => <Badge key={id} variant="outline">{claimsById.has(id) ? `${claimsById.get(id)?.type}=${claimsById.get(id)?.value}` : id}</Badge>) : <span className="text-slate-500">Nenhuma</span>}</div></TableCell><TableCell>{group.version}</TableCell><TableCell><div className="flex justify-end gap-2">{canEdit || canLinkClaims || canLinkUsers ? <Button size="icon" variant="outline" aria-label={`Editar ${group.name}`} onClick={() => setEditing(group)}><Pencil size={16} /></Button> : null}{canDelete ? <Button size="icon" variant="destructive" aria-label={`Excluir ${group.name}`} onClick={() => void remove(group)}><Trash2 size={16} /></Button> : null}</div></TableCell></TableRow>)}
  </TableBody></Table></CardContent></Card> : null}
  {!loading && canViewClaims ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck size={18} />Catálogo de claims</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{claims.map((claim) => <Badge key={claim.id} variant="secondary">{claim.type}={claim.value}</Badge>)}</div></CardContent></Card> : null}
  {editing ? <GroupDialog key={editing === "new" ? "new" : `${editing.id}-${editing.version}`} group={editing} claims={claims} users={users} canEditDetails={canEdit || editing === "new"} canLinkClaims={canLinkClaims && canViewClaims} canLinkUsers={canLinkUsers} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setRevision((v) => v + 1); }} /> : null}
 </div>;
}
