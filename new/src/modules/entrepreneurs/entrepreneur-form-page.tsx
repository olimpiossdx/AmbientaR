import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Card, CardContent, Input, PageHeader, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { entrepreneursService, EntrepreneurApiError } from "./entrepreneurs.service";
import { emptyEntrepreneur, entityTypes, type EntrepreneurInput } from "./entrepreneurs.types";
export function NewEntrepreneurPage() { return <EntrepreneurFormPage />; }
export function EditEntrepreneurPage() { const { id } = useParams({ strict: false }) as { id: string }; return <EntrepreneurFormPage key={id} id={id} />; }
function EntrepreneurFormPage({ id }: { id?: string }) {
 const navigate = useNavigate(); const [input, setInput] = useState<EntrepreneurInput>(emptyEntrepreneur);
 const [version, setVersion] = useState(0); const [loading, setLoading] = useState(!!id); const [loaded, setLoaded] = useState(!id); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [conflict, setConflict] = useState(false); const [revision, setRevision] = useState(0); const [saved, setSaved] = useState(false);
 useEffect(() => {
  if (!id) return; const controller = new AbortController(); setLoading(true); setLoaded(false); setError("");
  entrepreneursService.get(id, controller.signal).then(item => { if (!controller.signal.aborted) { setInput(item); setVersion(item.version); setLoaded(true); setConflict(false); } }).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Erro ao carregar cadastro."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [id, revision]);
 async function submit(event: FormEvent) {
  event.preventDefault(); setError(""); if (!input.entityType.length) { setError("Selecione ao menos um tipo de pessoa."); return; } setSaving(true);
  try { const result = id ? await entrepreneursService.update(id, version, input) : await entrepreneursService.create(input); setVersion(result.version); setSaved(true); }
  catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao salvar."); setConflict(cause instanceof EntrepreneurApiError && cause.httpStatus === 409); }
  finally { setSaving(false); }
 }
 const text = (field: keyof Omit<EntrepreneurInput, "entityType">, label: string, required = false, type = "text", maxLength = 200) => <Input key={field} name={field} label={label} type={type} required={required} maxLength={maxLength} value={input[field]} onChange={e => setInput(current => ({ ...current, [field]: e.target.value }))} />;
 return <div><PageHeader title={id ? "Editar empreendedor" : "Novo empreendedor"} description="Dados comerciais e de contato." /><main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
  {error ? <Alert variant="error" title="Não foi possível concluir">{error}{id && (!loaded || conflict) ? <Button variant="outline" onClick={() => setRevision(v => v + 1)}>Recarregar cadastro e descartar alterações</Button> : null}</Alert> : null}
  {loading ? <Skeleton className="h-80 w-full" /> : saved ? <Card><CardContent className="space-y-4 p-6"><p role="status">Empreendedor salvo com sucesso.</p><Button onClick={() => void navigate({ to: "/app/empreendedores", search: { q: "", page: 1 } })}>Voltar para empreendedores</Button></CardContent></Card> : loaded ? <Card><CardContent className="p-6"><form className="space-y-5" onSubmit={submit}><fieldset disabled={saving} className="space-y-5">
   <div className="grid gap-4 sm:grid-cols-2">{text("name", "Nome / razão social", true, "text", 160)}{text("cpfCnpj", "CPF/CNPJ", true, "text", 18)}{text("phone", "Telefone", true, "tel", 40)}{text("email", "E-mail", true, "email", 254)}</div>
   <fieldset><legend className="mb-2 font-medium">Tipo de pessoa</legend><div className="flex flex-wrap gap-4">{entityTypes.map(type => <Input key={type} name={`type-${type}`} type="checkbox" label={type} checked={input.entityType.includes(type)} onChange={e => setInput(current => ({ ...current, entityType: e.target.checked ? [...current.entityType, type] : current.entityType.filter(value => value !== type) }))} />)}</div></fieldset>
   <div className="grid gap-4 sm:grid-cols-2">{text("dataNascimento", "Data de nascimento", false, "date")}{text("ctfIbama", "CTF IBAMA")}{text("address", "Logradouro")}{text("numero", "Número")}{text("bairro", "Bairro")}{text("complemento", "Complemento")}{text("municipio", "Município")}{text("uf", "UF", false, "text", 2)}{text("cep", "CEP", false, "text", 9)}</div>
  </fieldset><div className="flex gap-3"><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate({ to: "/app/empreendedores", search: { q: "", page: 1 } })}>Cancelar</Button><Button type="submit" isLoading={saving} disabled={!!id && conflict}>Salvar</Button></div></form></CardContent></Card> : null}
 </main></div>;
}
