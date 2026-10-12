import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PageHeader, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { useClaim } from "../../app/authorization/use-claim";
import { entrepreneursService } from "./entrepreneurs.service";
import { ENTREPRENEUR_CLAIMS, type Entrepreneur } from "./entrepreneurs.types";
export function EntrepreneursPage() {
 const search = useSearch({ strict: false }) as { q?: string; page?: number };
 const q = search.q ?? ""; const page = search.page ?? 1;
 const navigate = useNavigate();
 const canCreate = useClaim(ENTREPRENEUR_CLAIMS.create); const canEdit = useClaim(ENTREPRENEUR_CLAIMS.edit); const canRemove = useClaim(ENTREPRENEUR_CLAIMS.remove);
 const [draft, setDraft] = useState(q); const [items, setItems] = useState<Entrepreneur[]>([]); const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
 const [removing, setRemoving] = useState<Entrepreneur | null>(null); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState(""); const [detail, setDetail] = useState<Entrepreneur | null>(null);
 useEffect(() => setDraft(q), [q]);
 useEffect(() => {
  const controller = new AbortController(); setLoading(true); setError("");
  entrepreneursService.list(q, page, controller.signal).then(result => { if (!controller.signal.aborted) { setItems(result.items); setTotal(result.total); } }).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Erro ao carregar cadastros."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [q, page, revision]);
 const go = (nextPage: number, nextQuery = q) => void navigate({ to: "/app/empreendedores", search: { q: nextQuery, page: nextPage } });
 const submit = (event: FormEvent) => { event.preventDefault(); go(1, draft.trim()); };
 async function remove() {
  if (!removing) return; setSaving(true); setError("");
  try { await entrepreneursService.remove(removing.id, removing.version); setRemoving(null); setNotice("Cadastro excluído. O histórico foi preservado."); if (items.length === 1 && page > 1) go(page - 1); else setRevision(v => v + 1); }
  catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao excluir."); setRemoving(null); }
  finally { setSaving(false); }
 }
 return <div><PageHeader title="Empreendedores" description="Cadastros comerciais da sua empresa." /><main className="space-y-4 p-4 sm:p-8">
  <div className="flex flex-wrap items-end gap-3"><form className="flex flex-1 items-end gap-2" onSubmit={submit}><Input label="Buscar por nome ou CPF/CNPJ" name="search" maxLength={200} value={draft} onChange={e => setDraft(e.target.value)} /><Button type="submit">Buscar</Button></form>{canCreate ? <Button onClick={() => void navigate({ to: "/app/empreendedores/new" })}>Novo empreendedor</Button> : null}</div>
  {notice ? <p role="status" className="text-emerald-700">{notice}</p> : null}
  {error ? <Alert variant="error" title="Não foi possível concluir">{error}<Button variant="outline" onClick={() => setRevision(v => v + 1)}>Recarregar</Button></Alert> : null}
  {loading ? <Skeleton className="h-56 w-full" /> : !error ? <>
   {items.length === 0 ? <Card><CardContent className="p-6">Nenhum empreendedor encontrado.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{items.map(item => <Card key={item.id}><CardContent className="space-y-2 p-5"><h2 className="font-semibold">{item.name}</h2><p>{item.cpfCnpj}</p><p className="break-all text-sm">{item.email} · {item.phone}</p><p className="text-sm text-slate-600">{item.entityType.join(", ")}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDetail(item)}>Detalhes</Button>{canEdit ? <Button variant="outline" onClick={() => void navigate({ to: "/app/empreendedores/$id/edit", params: { id: item.id } })}>Editar</Button> : null}{canRemove ? <Button variant="outline" onClick={() => setRemoving(item)}>Excluir</Button> : null}</div></CardContent></Card>)}</div>}
   <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => go(page - 1)}>Anterior</Button><span>{total} cadastros · Página {page} de {Math.max(1, Math.ceil(total / 10))}</span><Button variant="outline" disabled={page * 10 >= total} onClick={() => go(page + 1)}>Próxima</Button></div>
  </> : null}
  <Dialog open={!!removing} onOpenChange={open => { if (!open && !saving) setRemoving(null); }}><DialogContent><DialogHeader><DialogTitle>Excluir empreendedor</DialogTitle><DialogDescription>Excluir {removing?.name}? O cadastro deixará de aparecer na lista. O histórico e o CPF/CNPJ permanecerão reservados.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={saving} onClick={() => setRemoving(null)}>Cancelar</Button><Button isLoading={saving} onClick={() => void remove()}>Excluir</Button></DialogFooter></DialogContent></Dialog>
  <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent><DialogHeader><DialogTitle>{detail?.name}</DialogTitle><DialogDescription>Dados cadastrais</DialogDescription></DialogHeader>{detail ? <dl className="space-y-2 text-sm">{Object.entries({ "CPF/CNPJ": detail.cpfCnpj, Tipo: detail.entityType.join(", "), Email: detail.email, Telefone: detail.phone, Nascimento: detail.dataNascimento, "CTF IBAMA": detail.ctfIbama, Endereço: [detail.address, detail.numero, detail.complemento, detail.bairro, detail.municipio, detail.uf, detail.cep].filter(Boolean).join(", ") }).map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="break-words">{value || "Não informado"}</dd></div>)}</dl> : null}</DialogContent></Dialog>
 </main></div>;
}
