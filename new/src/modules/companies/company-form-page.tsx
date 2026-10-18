import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Card, CardContent, Input, PageHeader, Select, Skeleton, Textarea } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { companiesService, CompanyApiError } from "./companies.service";
import { emptyCompany, type CompanyInput } from "./companies.types";

export function NewCompanyPage() { return <CompanyFormPage />; }
export function EditCompanyPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <CompanyFormPage key={id} id={id} />;
}
function CompanyFormPage({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [input, setInput] = useState<CompanyInput>(emptyCompany);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [loaded, setLoaded] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true); setLoaded(false); setError("");
    companiesService.get(id, controller.signal)
      .then(company => { if (!controller.signal.aborted) { setInput(company); setVersion(company.version); setLoaded(true); setConflict(false); } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Falha ao carregar empresa."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  const field = (name: keyof CompanyInput, label: string, options: { required?: boolean; type?: string; maxLength?: number } = {}) => (
    <Input name={name} label={label} required={options.required} type={options.type ?? "text"} maxLength={options.maxLength ?? 200}
      value={input[name]} onChange={event => setInput(current => ({ ...current, [name]: event.target.value }))} />
  );
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setConflict(false);
    const cnpj = input.cnpj.replace(/\D/g, "");
    if (!/^\d{14}$/.test(cnpj)) { setError("Informe um CNPJ com 14 dígitos."); return; }
    setSaving(true);
    try {
      const payload = { ...input, cnpj, email: input.email.trim().toLowerCase() };
      const result = id ? await companiesService.update(id, version, payload) : await companiesService.create(payload);
      setVersion(result.version); setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar empresa.");
      setConflict(cause instanceof CompanyApiError && cause.httpStatus === 409);
    } finally { setSaving(false); }
  }
  return <div>
    <PageHeader title={id ? "Editar empresa responsável" : "Nova empresa responsável"} description="Dados jurídicos, endereço e contato da empresa." />
    <main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-8">
      {error ? <Alert variant="error" title="Não foi possível concluir">{error}{id && (!loaded || conflict) ? <Button variant="outline" onClick={() => setRevision(value => value + 1)}>Recarregar cadastro</Button> : null}</Alert> : null}
      {loading ? <Skeleton className="h-80 w-full" /> : saved ? <Card><CardContent className="space-y-4 p-6"><p role="status">Empresa salva com sucesso.</p><Button onClick={() => void navigate({ to: "/app/responsible-company", search: { q: "", page: 1 } })}>Voltar para empresas</Button></CardContent></Card> : loaded ? <Card><CardContent className="p-6">
        <form className="space-y-6" onSubmit={event => void submit(event)}>
          <fieldset disabled={saving} className="space-y-5">
            <section className="space-y-4"><h2 className="text-lg font-semibold">Dados jurídicos</h2>
              <div className="grid gap-4 sm:grid-cols-2">{field("name", "Razão social", { required: true, maxLength: 160 })}{field("fantasyName", "Nome fantasia")}{field("cnpj", "CNPJ", { required: true, maxLength: 18 })}</div>
            </section>
            <section className="space-y-4 border-t pt-5"><h2 className="text-lg font-semibold">Endereço</h2>
              <div className="grid gap-4 sm:grid-cols-2">{field("address", "Logradouro")}{field("numero", "Número")}{field("caixaPostal", "Caixa postal")}{field("district", "Bairro ou distrito")}{field("municipio", "Município")}{field("uf", "UF", { maxLength: 2 })}{field("cep", "CEP", { maxLength: 9 })}</div>
            </section>
            <section className="space-y-4 border-t pt-5"><h2 className="text-lg font-semibold">Contato</h2>
              <div className="grid gap-4 sm:grid-cols-2">{field("ddd", "DDD", { maxLength: 2 })}{field("phone", "Telefone", { type: "tel" })}{field("fax", "Fax", { type: "tel" })}{field("email", "E-mail", { type: "email", maxLength: 254 })}</div>
            </section>
            <section className="space-y-4 border-t pt-5"><h2 className="text-lg font-semibold">Dados bancários e PIX</h2>
              <p className="text-sm text-slate-600">Esses dados podem ser usados nos fluxos de contrato e pagamento da plataforma.</p>
              <div className="grid gap-4 sm:grid-cols-2">{field("bankName", "Banco")}{field("bankAgency", "Agência")}{field("bankAccount", "Conta")}</div>
              <Select name="bankAccountType" label="Tipo de conta" value={input.bankAccountType} onChange={event => setInput(current => ({ ...current, bankAccountType: event.target.value as CompanyInput["bankAccountType"] }))}>
                <option value="">Selecione</option><option value="corrente">Corrente</option><option value="poupanca">Poupança</option>
              </Select>
              {field("pixKey", "Chave PIX")}
              <Textarea name="pixCopyPaste" label="PIX copia e cola" rows={3} maxLength={2000} value={input.pixCopyPaste} onChange={event => setInput(current => ({ ...current, pixCopyPaste: event.target.value }))} />
            </section>
          </fieldset>
          <div className="flex gap-3"><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate({ to: "/app/responsible-company", search: { q: "", page: 1 } })}>Cancelar</Button><Button type="submit" isLoading={saving} disabled={!!id && conflict}>Salvar</Button></div>
        </form>
      </CardContent></Card> : null}
    </main>
  </div>;
}
