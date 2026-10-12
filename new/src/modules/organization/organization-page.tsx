import { useEffect, useState, type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { Button, Card, CardContent, Input, PageHeader, Skeleton } from "../../componentes";
import Alert from "../../componentes/alert/alert";
import { organizationService, type Organization } from "./organization.service";
export function OrganizationPage() {
 const [organization, setOrganization] = useState<Organization | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [loaded, setLoaded] = useState(false);
 const [name, setName] = useState("");
 const [revision, setRevision] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  setLoading(true); setError(null); setLoaded(false);
  organizationService.current(controller.signal).then((result) => {
   if (!controller.signal.aborted) { setOrganization(result); setLoaded(true); }
  }).catch((cause: unknown) => {
   if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível consultar sua empresa.");
  }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [revision]);
 async function submit(event: FormEvent) {
  event.preventDefault(); setSaving(true); setError(null);
  try { setOrganization(await organizationService.create(name)); }
  catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a empresa."); }
  finally { setSaving(false); }
 }
 return <div className="min-h-full bg-slate-50">
  <PageHeader title="Minha empresa" description="Consulte a empresa vinculada à sua conta." />
  <main className="mx-auto max-w-2xl space-y-4 p-4 sm:p-8">
   {error ? <Alert variant="error" title="Não foi possível concluir">{error}<Button className="mt-3" variant="outline" onClick={() => setRevision((value) => value + 1)}>Consultar novamente</Button></Alert> : null}
   {loading ? <Skeleton className="h-48 w-full" /> : organization ? <Card><CardContent className="space-y-3 p-6">
    <Building2 className="text-emerald-600" /><h2 className="text-xl font-semibold">{organization.name}</h2>
    <p className="text-sm text-slate-600">Os dados desta empresa ficam separados dos dados de outras empresas. O acesso a cada módulo depende das permissões atribuídas à sua conta.</p>
   </CardContent></Card> : loaded ? <Card><CardContent className="space-y-4 p-6">
    <h2 className="text-lg font-semibold">Vincule sua conta a uma empresa</h2>
    <p className="text-sm text-slate-600">Se você está iniciando uma empresa no AmbientaR, crie o espaço abaixo. Se faz parte de uma empresa já cadastrada, solicite o vínculo ao responsável antes de prosseguir.</p>
    <form className="space-y-4" onSubmit={submit}>
     <Input label="Nome da empresa" name="organization-name" required minLength={3} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
     <Button type="submit" isLoading={saving}>Criar minha empresa</Button>
    </form>
   </CardContent></Card> : null}
  </main>
 </div>;
}
