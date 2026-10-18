import { useEffect, useState } from "react";
import { Button, Card, CardContent } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { carService } from "./car.service";
import type { CarFile } from "./car.types";

export function CarFilesPanel({ carId }: { carId: string }) {
  const [files, setFiles] = useState<CarFile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    carService.get(carId).then(record => { if (active) setFiles(record.files); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Falha ao carregar anexos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [carId, revision]);

  async function upload(kind: CarFile["kind"], file?: File) {
    if (!file) return;
    setBusy(`upload-${kind}`); setError("");
    try {
      await carService.uploadFile(carId, kind, file);
      setRevision(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao enviar arquivo.");
    } finally { setBusy(""); }
  }

  async function remove(file: CarFile) {
    setBusy(file.id); setError("");
    try { await carService.removeFile(carId, file.id); setFiles(current => current.filter(item => item.id !== file.id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao remover arquivo."); }
    finally { setBusy(""); }
  }

  return <Card><CardContent className="space-y-4 p-6">
    <div><h2 className="font-semibold">Anexos do CAR</h2><p className="text-sm text-slate-600">PDF do recibo e geometria em ZIP ou SHP. Limite: 40 MB por arquivo.</p></div>
    {error ? <Alert variant="error" title="Não foi possível concluir">{error}<Button variant="outline" onClick={() => setRevision(value => value + 1)}>Recarregar anexos</Button></Alert> : null}
    <div className="flex flex-wrap gap-3">
      <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-slate-50">Adicionar PDF
        <input className="sr-only" type="file" accept="application/pdf,.pdf" disabled={!!busy} onChange={event => { void upload("pdf", event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </label>
      <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-slate-50">Adicionar geometria
        <input className="sr-only" type="file" accept=".zip,.shp,application/zip" disabled={!!busy} onChange={event => { void upload("geometry", event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </label>
      {busy.startsWith("upload-") ? <span role="status" className="self-center text-sm text-slate-600">Enviando arquivo…</span> : null}
    </div>
    {loading ? <p role="status" className="text-sm text-slate-600">Carregando anexos…</p> : files.length ? <ul className="divide-y rounded-md border">{files.map(file => <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
      <span className="min-w-0"><span className="block truncate font-medium">{file.name}</span><span className="text-xs text-slate-500">{file.kind === "pdf" ? "PDF" : "Geometria"} · {(file.size / 1024 / 1024).toFixed(2)} MB</span></span>
      <span className="flex gap-2"><Button variant="outline" disabled={!!busy} onClick={() => void carService.downloadFile(carId, file).catch(cause => setError(cause instanceof Error ? cause.message : "Falha ao baixar arquivo."))}>Baixar</Button><Button variant="outline" disabled={!!busy} isLoading={busy === file.id} onClick={() => void remove(file)}>Remover</Button></span>
    </li>)}</ul> : <p className="text-sm text-slate-600">Nenhum anexo enviado.</p>}
  </CardContent></Card>;
}
