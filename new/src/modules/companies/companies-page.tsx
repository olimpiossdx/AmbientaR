import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PageHeader, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { useClaim } from "../../app/authorization/use-claim";
import { companiesService } from "./companies.service";
import { COMPANY_CLAIMS, type Company } from "./companies.types";

export function CompaniesPage() {
  const { q = "", page = 1 } = useSearch({ strict: false }) as { q?: string; page?: number };
  const navigate = useNavigate();
  const canCreate = useClaim(COMPANY_CLAIMS.create);
  const canEdit = useClaim(COMPANY_CLAIMS.edit);
  const canRemove = useClaim(COMPANY_CLAIMS.remove);
  const [draft, setDraft] = useState(q);
  const [items, setItems] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [removing, setRemoving] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    companiesService.list(q, page, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setItems(result.items); setTotal(result.total); } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar empresas."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [q, page, revision]);
  const go = (nextPage: number, nextQuery = q) => void navigate({ to: "/app/responsible-company", search: { q: nextQuery, page: nextPage } });
  async function remove() {
    if (!removing) return;
    setSaving(true); setError("");
    try {
      await companiesService.remove(removing.id, removing.version);
      setRemoving(null);
      if (items.length === 1 && page > 1) go(page - 1); else setRevision(value => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao excluir."); setRemoving(null); }
    finally { setSaving(false); }
  }
  return <div><PageHeader title="Empresas responsáveis" description="Cadastros jurídicos, bancários e de contato." />
    <main className="space-y-4 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3"><form className="flex flex-1 items-end gap-2" onSubmit={(event: FormEvent) => { event.preventDefault(); go(1, draft.trim()); }}>
        <Input name="company-search" label="Buscar por razão social, nome fantasia ou CNPJ" maxLength={200} value={draft} onChange={event => setDraft(event.target.value)} /><Button type="submit">Buscar</Button>
      </form>{canCreate ? <Button onClick={() => void navigate({ to: "/app/responsible-company/new" })}>Nova empresa</Button> : null}</div>
      {error ? <Alert variant="error" title="Não foi possível concluir">{error}<Button variant="outline" onClick={() => setRevision(value => value + 1)}>Recarregar</Button></Alert> : null}
      {loading ? <Skeleton className="h-56 w-full" /> : !error ? <>
        {items.length === 0 ? <Card><CardContent className="p-6">Nenhuma empresa encontrada.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{items.map(item => <Card key={item.id}><CardContent className="space-y-2 p-5">
          <h2 className="font-semibold">{item.name}</h2><p className="font-mono text-sm">{item.cnpj}</p>
          <p className="break-all text-sm text-slate-600">{item.fantasyName || "Sem nome fantasia"}{item.email ? ` · ${item.email}` : ""}</p>
          <p className="text-sm text-slate-600">{[item.municipio, item.uf].filter(Boolean).join("/") || "Município não informado"}</p>
          <div className="flex flex-wrap gap-2">{canEdit ? <Button variant="outline" onClick={() => void navigate({ to: "/app/responsible-company/$id/edit", params: { id: item.id } })}>Editar</Button> : null}{canRemove ? <Button variant="outline" onClick={() => setRemoving(item)}>Excluir</Button> : null}</div>
        </CardContent></Card>)}</div>}
        <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => go(page - 1)}>Anterior</Button><span>{total} empresas · Página {page} de {Math.max(1, Math.ceil(total / 10))}</span><Button variant="outline" disabled={page * 10 >= total} onClick={() => go(page + 1)}>Próxima</Button></div>
      </> : null}
      <Dialog open={!!removing} onOpenChange={open => { if (!open && !saving) setRemoving(null); }}><DialogContent><DialogHeader><DialogTitle>Excluir empresa</DialogTitle><DialogDescription>Excluir {removing?.name}? O registro deixará de aparecer na lista e seu CNPJ permanecerá reservado.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={saving} onClick={() => setRemoving(null)}>Cancelar</Button><Button isLoading={saving} onClick={() => void remove()}>Excluir</Button></DialogFooter></DialogContent></Dialog>
    </main>
  </div>;
}
