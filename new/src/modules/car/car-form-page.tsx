import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Card, CardContent, Input, PageHeader, Select, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { carService, CarApiError } from "./car.service";
import type { CarInput, CarProjectOption } from "./car.types";
import { useClaim } from "../../app/authorization/use-claim";
import { CAR_CLAIMS } from "./car.types";
import { CarFilesPanel } from "./car-files-panel";

export function NewCarPage() { return <CarFormPage />; }
export function EditCarPage() { const { id } = useParams({ strict: false }) as { id: string }; return <CarFormPage key={id} id={id} />; }
function CarFormPage({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<CarProjectOption[]>([]);
  const [input, setInput] = useState<CarInput>({ projectId: "", receiptNumber: "" });
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [ready, setReady] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState(id ?? "");
  const canEdit = useClaim(CAR_CLAIMS.edit);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    carService.projects(controller.signal).then(items => { if (!controller.signal.aborted) setProjects(items); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar empreendimentos."); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true); setReady(false); setError("");
    carService.get(id, controller.signal).then(item => { if (!controller.signal.aborted) { setInput({ projectId: item.projectId, receiptNumber: item.receiptNumber }); setVersion(item.version); setReady(true); setConflict(false); } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar CAR."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setConflict(false);
    if (!input.projectId) { setError("Selecione o empreendimento."); return; }
    if (input.receiptNumber.trim().length < 4) { setError("Informe o número do recibo CAR."); return; }
    setSaving(true);
    try {
      const result = id ? await carService.update(id, version, { ...input, receiptNumber: input.receiptNumber.trim() }) : await carService.create({ ...input, receiptNumber: input.receiptNumber.trim() });
      setVersion(result.version); setSavedRecordId(result.id); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao salvar CAR."); setConflict(cause instanceof CarApiError && cause.httpStatus === 409); }
    finally { setSaving(false); }
  }
  return <div><PageHeader title={id ? "Editar registro CAR" : "Vincular CAR a empreendimento"} description="Informe o recibo e vincule-o a um empreendimento da sua organização." />
    <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-8">
      {error ? <Alert variant="error" title="Não foi possível concluir">{error}{id && (!ready || conflict) ? <Button variant="outline" onClick={() => setRevision(value => value + 1)}>Recarregar registro</Button> : null}</Alert> : null}
      {loading ? <Skeleton className="h-72 w-full" /> : saved ? <div className="space-y-4"><Card><CardContent className="space-y-4 p-6"><p role="status">Registro CAR salvo.</p><Button onClick={() => void navigate({ to: "/app/car", search: { q: "", page: 1 } })}>Voltar para CAR</Button></CardContent></Card>{canEdit ? <CarFilesPanel carId={savedRecordId} /> : null}</div> : ready ? <Card><CardContent className="p-6">
        <form className="space-y-5" onSubmit={event => void submit(event)}>
          <fieldset disabled={saving} className="space-y-5">
            <Select name="projectId" label="Empreendimento" required value={input.projectId} onChange={event => setInput(current => ({ ...current, projectId: event.target.value }))}>
              <option value="">Selecione um empreendimento</option>
              {projects.map(project => <option key={project.id} value={project.id}>{project.propertyName}{project.municipio ? ` — ${project.municipio}/${project.uf ?? ""}` : ""}</option>)}
            </Select>
            {projects.length === 0 ? <p className="text-sm text-amber-800">Cadastre primeiro um empreendimento.</p> : null}
            <Input name="receiptNumber" label="Número do recibo do CAR" required maxLength={120} value={input.receiptNumber} onChange={event => setInput(current => ({ ...current, receiptNumber: event.target.value }))} placeholder="Ex.: MG-1234-5678-9012" />
          </fieldset>
          <div className="flex gap-3"><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate({ to: "/app/car", search: { q: "", page: 1 } })}>Cancelar</Button><Button type="submit" isLoading={saving} disabled={!projects.length || (!!id && conflict)}>Salvar CAR</Button></div>
        </form>
      </CardContent></Card> : null}
    </main>
  </div>;
}
