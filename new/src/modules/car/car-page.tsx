import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PageHeader, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { useClaim } from "../../app/authorization/use-claim";
import { carService } from "./car.service";
import { CAR_CLAIMS, type CarRecord } from "./car.types";

export function CarPage() {
  const { q = "", page = 1 } = useSearch({ strict: false }) as { q?: string; page?: number };
  const navigate = useNavigate();
  const canCreate = useClaim(CAR_CLAIMS.create); const canEdit = useClaim(CAR_CLAIMS.edit); const canRemove = useClaim(CAR_CLAIMS.remove);
  const [draft, setDraft] = useState(q); const [items, setItems] = useState<CarRecord[]>([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  const [removing, setRemoving] = useState<CarRecord | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    carService.list(q, page, controller.signal).then(result => { if (!controller.signal.aborted) { setItems(result.items); setTotal(result.total); } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar registros CAR."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [q, page, revision]);
  const go = (nextPage: number, nextQuery = q) => void navigate({ to: "/app/car", search: { q: nextQuery, page: nextPage } });
  async function remove() {
    if (!removing) return; setSaving(true); setError("");
    try { await carService.remove(removing.id, removing.version); setRemoving(null); if (items.length === 1 && page > 1) go(page - 1); else setRevision(value => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao excluir o registro."); setRemoving(null); }
    finally { setSaving(false); }
  }
  return <div><PageHeader title="Cadastro Ambiental Rural (CAR)" description="Recibos CAR vinculados aos empreendimentos." />
    <main className="space-y-4 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3"><form className="flex flex-1 items-end gap-2" onSubmit={event => { event.preventDefault(); go(1, draft.trim()); }}>
        <Input name="car-search" label="Buscar por recibo ou empreendimento" maxLength={200} value={draft} onChange={event => setDraft(event.target.value)} /><Button type="submit">Buscar</Button>
      </form>{canCreate ? <Button onClick={() => void navigate({ to: "/app/car/new" })}>Vincular CAR</Button> : null}</div>
      {error ? <Alert variant="error" title="Não foi possível concluir">{error}<Button variant="outline" onClick={() => setRevision(value => value + 1)}>Recarregar</Button></Alert> : null}
      {loading ? <Skeleton className="h-56 w-full" /> : !error ? <>
        {items.length === 0 ? <Card><CardContent className="p-6">Nenhum CAR cadastrado.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{items.map(item => <Card key={item.id}><CardContent className="space-y-2 p-5">
          <h2 className="font-semibold">{item.projectName}</h2><p>{item.municipio ? `${item.municipio}/${item.uf ?? ""}` : "Município não informado"}</p>
          <p className="text-sm text-slate-600">Recibo: {item.receiptNumber}</p>
          {item.files.length ? <div className="space-y-1 border-t pt-2"><p className="text-sm font-medium">Anexos ({item.files.length})</p>{item.files.map(file => <button key={file.id} className="block text-sm text-blue-700 underline" onClick={() => void carService.downloadFile(item.id, file).catch(cause => setError(cause instanceof Error ? cause.message : "Falha ao baixar anexo."))}>{file.name} · Baixar</button>)}</div> : <p className="text-sm text-slate-500">Sem anexos</p>}
          <div className="flex gap-2">{canEdit ? <Button variant="outline" onClick={() => void navigate({ to: "/app/car/$id/edit", params: { id: item.id } })}>Editar</Button> : null}{canRemove ? <Button variant="outline" onClick={() => setRemoving(item)}>Excluir</Button> : null}</div>
        </CardContent></Card>)}</div>}
        <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => go(page - 1)}>Anterior</Button><span>{total} registros · Página {page} de {Math.max(1, Math.ceil(total / 10))}</span><Button variant="outline" disabled={page * 10 >= total} onClick={() => go(page + 1)}>Próxima</Button></div>
      </> : null}
      <Dialog open={!!removing} onOpenChange={open => { if (!open && !saving) setRemoving(null); }}><DialogContent><DialogHeader><DialogTitle>Excluir registro CAR</DialogTitle><DialogDescription>Remover o vínculo do recibo {removing?.receiptNumber} com {removing?.projectName}?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={saving} onClick={() => setRemoving(null)}>Cancelar</Button><Button isLoading={saving} onClick={() => void remove()}>Excluir</Button></DialogFooter></DialogContent></Dialog>
    </main>
  </div>;
}
