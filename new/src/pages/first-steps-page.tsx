import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, CheckCircle2, Clock3, KeyRound, Send } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, PageHeader, Skeleton } from "../componentes";
import Alert from "../componentes/alert/alert";
import { useAuthSnapshot } from "../auth/auth-hooks";
import { authService } from "../auth/auth-service";
import { authStore } from "../auth/auth-store";
import { extractAuthSessionData } from "../auth/auth.types";
import { isValidCpfCnpj, normalizeCpfCnpj } from "../auth/auth-validation";
import type { RegisterMode } from "../auth/auth.types";
import { organizationService } from "../modules/organization/organization.service";
import { authorizationService } from "../app/authorization/authorization-service";
import { filterNavigationByClaims } from "../app/navigation/navigation-filter";
import { appNavigation } from "../app/navigation/navigation-registry";
import type { NavigationItem } from "../app/navigation/navigation.types";

type AccessRequest = {
 id: string;
 targetDocument: string;
 requestType: "representative" | "consultor_representante";
 status: "pending" | "approved" | "rejected";
 createdAt: string;
 requesterName?: string;
 requesterEmail?: string;
};

function parseRequests(value: unknown): AccessRequest[] {
 if (!Array.isArray(value)) return [];
 return value.flatMap((item) => {
  if (!item || typeof item !== "object") return [];
  const request = item as Partial<AccessRequest>;
  if (
   typeof request.id !== "string" ||
   typeof request.targetDocument !== "string" ||
   (request.requestType !== "representative" && request.requestType !== "consultor_representante") ||
   (request.status !== "pending" && request.status !== "approved" && request.status !== "rejected") ||
   typeof request.createdAt !== "string"
  ) return [];
  return [request as AccessRequest];
 });
}

function modeName(mode: RegisterMode | null): string {
 if (mode === "cliente_autonomo") return "titular";
 if (mode === "representative") return "representante";
 if (mode === "consultor_representante") return "consultor representante";
 return "usuário";
}

function firstAccessiblePath(items: readonly NavigationItem[]): string | null {
 for (const item of items) {
  if (item.to?.startsWith("/app/") && item.to !== "/app/primeiros-passos") return item.to;
  if (item.children?.length) {
   const nested = firstAccessiblePath(item.children);
   if (nested) return nested;
  }
 }
 return null;
}

export function FirstStepsPage() {
 const snapshot = useAuthSnapshot();
 const navigate = useNavigate();
 const [requests, setRequests] = useState<AccessRequest[]>([]);
 const [receivedRequests, setReceivedRequests] = useState<AccessRequest[]>([]);
 const [document, setDocument] = useState("");
 const [loadingRequests, setLoadingRequests] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [notice, setNotice] = useState<string | null>(null);
 const mode = snapshot.registrationMode;
 const onboarding = snapshot.onboarding;
 const visibleNavigation = useMemo(() => filterNavigationByClaims(appNavigation, authorizationService), [snapshot.revision]);
 const hasDashboardClaim = snapshot.claims.some((claim) => claim.claimType.toLowerCase() === "recurso.dashboard" && claim.claimValue.toLowerCase() === "visualizar");
 const nextAuthorizedPath = firstAccessiblePath(visibleNavigation);
 const action = onboarding?.nextAction ?? (
  mode === "cliente_autonomo" && !snapshot.user?.organizationId
   ? "create_organization"
   : mode === "representative" || mode === "consultor_representante"
    ? "request_access"
    : snapshot.claims.length === 0 ? "awaiting_permissions" : "open_app"
 );
 const isDelegate = mode === "representative" || mode === "consultor_representante";
 const isTitularWithOrganization = mode === "cliente_autonomo" && Boolean(snapshot.user?.organizationId);

 useEffect(() => {
  if (!isDelegate) return;
  const controller = new AbortController();
  setLoadingRequests(true);
  authService.listMyAccessRequests(controller.signal).then((response) => {
   if (response.ok) {
    const loaded = parseRequests(response.data);
    setRequests(loaded);
    if (loaded.some((request) => request.status === "approved")) {
     void authService.session().then((sessionResponse) => {
      const session = sessionResponse.ok ? extractAuthSessionData(sessionResponse) : null;
      if (session) authStore.setAuthenticated(session);
     });
    }
   }
   else if (!controller.signal.aborted) setError(response.error?.message ?? "Não foi possível consultar seus pedidos.");
  }).catch((cause: unknown) => {
   if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível consultar seus pedidos.");
  }).finally(() => {
   if (!controller.signal.aborted) setLoadingRequests(false);
  });
  return () => controller.abort();
 }, [isDelegate]);

 useEffect(() => {
  if (!isTitularWithOrganization) return;
  const controller = new AbortController();
  authService.listReceivedAccessRequests(controller.signal).then((response) => {
   if (response.ok) setReceivedRequests(parseRequests(response.data));
   else if (!controller.signal.aborted) setError(response.error?.message ?? "Não foi possível consultar os pedidos de vínculo.");
  }).catch((cause: unknown) => {
   if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível consultar os pedidos de vínculo.");
  });
  return () => controller.abort();
 }, [isTitularWithOrganization]);

 const pendingDocuments = useMemo(() => new Set(requests.filter((item) => item.status === "pending").map((item) => item.targetDocument)), [requests]);

 async function submitRequest(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const normalized = normalizeCpfCnpj(document);
  if (!isValidCpfCnpj(normalized)) {
   setError("Informe um CPF ou CNPJ válido do titular.");
   return;
  }
  setSubmitting(true);
  setError(null);
  setNotice(null);
  try {
   const response = await authService.createAccessRequest(normalized);
   if (!response.ok) throw new Error(response.error?.message ?? "Não foi possível registrar o pedido.");
   const refreshed = await authService.listMyAccessRequests();
   if (refreshed.ok) setRequests(parseRequests(refreshed.data));
   setDocument("");
   setNotice("Pedido registrado. O titular precisa aprovar o vínculo; a aprovação não libera módulos automaticamente. As opções do menu aparecem conforme as permissões atribuídas à sua conta.");
  } catch (cause) {
   setError(cause instanceof Error ? cause.message : "Não foi possível registrar o pedido.");
  } finally {
   setSubmitting(false);
  }
 }

 async function decideRequest(requestId: string, decision: "approve" | "reject") {
  setError(null);
  try {
   const response = await authService.decideAccessRequest(requestId, decision);
   if (!response.ok) throw new Error(response.error?.message ?? "Não foi possível analisar o pedido.");
   setReceivedRequests((current) => current.filter((request) => request.id !== requestId));
   setNotice(decision === "approve"
    ? "Vínculo aprovado. O acesso aos módulos depende da atribuição de um grupo de permissões."
    : "Pedido recusado.");
  } catch (cause) {
   setError(cause instanceof Error ? cause.message : "Não foi possível analisar o pedido.");
  }
 }

 async function refreshOrganizationSession() {
  try {
   await organizationService.current();
   const response = await authService.session();
   const session = response.ok ? extractAuthSessionData(response) : null;
   if (session) authStore.setAuthenticated(session);
   setNotice("Empresa vinculada. Seus módulos aparecerão assim que as permissões forem atribuídas à sua conta.");
  } catch (cause) {
   setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o estado da conta.");
  }
 }

 return (
  <div className="min-h-full bg-slate-50">
   <PageHeader title="Seus primeiros passos" description={`Olá, ${snapshot.user?.nome ?? "bem-vindo"}. Vamos continuar sua configuração como ${modeName(mode)}.`} />
   <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-8">
    {error ? <Alert variant="error" title="Não foi possível concluir">{error}</Alert> : null}
    {notice ? <Alert variant="success" title="Atualização da conta">{notice}</Alert> : null}

    {action === "create_organization" ? (
     <Card>
      <CardHeader>
       <div className="flex items-center gap-3"><Building2 className="h-6 w-6 text-emerald-700" /><div><CardTitle>Crie o espaço da sua empresa</CardTitle><CardDescription>Essa etapa vincula sua conta a uma empresa. Os módulos continuam protegidos pelas permissões atribuídas à sua conta.</CardDescription></div></div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
       <Button onClick={() => navigate({ to: "/app/organization" })}>Configurar minha empresa <ArrowRight className="ml-2 h-4 w-4" /></Button>
       <Button variant="outline" onClick={refreshOrganizationSession}>Já configurei</Button>
      </CardContent>
     </Card>
    ) : null}

    {isDelegate ? (
     <Card>
      <CardHeader>
       <div className="flex items-center gap-3"><Send className="h-6 w-6 text-emerald-700" /><div><CardTitle>{action === "request_access" ? "Solicite vínculo com um titular" : "Seus pedidos de vínculo"}</CardTitle><CardDescription>Informe o CPF ou CNPJ do titular. O pedido não concede acesso; depois da aprovação, um administrador também precisa atribuir as permissões adequadas.</CardDescription></div></div>
      </CardHeader>
      <CardContent className="space-y-5">
       {action === "request_access" ? <form onSubmit={submitRequest} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input label="CPF ou CNPJ do titular" name="targetDocument" autoComplete="off" value={document} onChange={(event) => setDocument(event.target.value)} required className="flex-1" />
        <Button type="submit" isLoading={submitting}><Send className="mr-2 h-4 w-4" />Enviar pedido</Button>
       </form> : <p className="text-sm text-slate-600">Seu vínculo está registrado. Peça ao administrador da empresa para atribuir um grupo com as permissões necessárias.</p>}
       {loadingRequests ? <Skeleton className="h-20 w-full" /> : requests.length > 0 ? (
        <div className="space-y-3">
         <h3 className="font-medium">Seus pedidos</h3>
         {requests.map((request) => (
          <div key={request.id} className="flex items-start gap-3 rounded-lg border p-4">
           {request.status === "pending" ? <Clock3 className="mt-0.5 h-5 w-5 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />}
           <div><p className="font-medium">{request.targetDocument}</p><p className="text-sm text-slate-600">{request.status === "pending" ? "Aguardando aprovação do titular." : request.status === "approved" ? "Vínculo aprovado; as permissões são atribuídas separadamente." : "Pedido recusado. Você pode enviar um novo pedido se necessário."}</p></div>
          </div>
         ))}
        </div>
       ) : <p className="text-sm text-slate-600">Ainda não há pedidos. Você pode enviar um pedido por titular.</p>}
       {pendingDocuments.size > 0 ? <p className="text-xs text-slate-500">Pedidos pendentes são limitados e não concedem acesso aos dados do titular.</p> : null}
      </CardContent>
     </Card>
    ) : null}

    {isTitularWithOrganization ? (
     <Card>
      <CardHeader><CardTitle>Pedidos de vínculo recebidos</CardTitle><CardDescription>Somente pedidos enviados para o documento da sua conta aparecem aqui. Aprovar um vínculo não atribui permissões de módulos.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
       {receivedRequests.length === 0 ? <p className="text-sm text-slate-600">Não há pedidos pendentes para analisar.</p> : receivedRequests.map((request) => (
        <div key={request.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
         <div><p className="font-medium">{request.requesterName ?? "Solicitante"}</p><p className="text-sm text-slate-600">{request.requesterEmail} · {request.requestType === "consultor_representante" ? "Consultor representante" : "Representante"}</p></div>
         <div className="flex gap-2"><Button variant="outline" onClick={() => void decideRequest(request.id, "reject")}>Recusar</Button><Button onClick={() => void decideRequest(request.id, "approve")}>Aprovar vínculo</Button></div>
        </div>
       ))}
      </CardContent>
     </Card>
    ) : null}

    {action === "awaiting_permissions" || (action === "open_app" && !hasDashboardClaim && !nextAuthorizedPath) ? (
     <Card>
      <CardHeader>
       <div className="flex items-center gap-3"><KeyRound className="h-6 w-6 text-amber-600" /><div><CardTitle>Conta pronta para receber permissões</CardTitle><CardDescription>A conta está criada, mas ainda não tem claims atribuídas por um grupo.</CardDescription></div></div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
       <p>Peça ao administrador da sua empresa para adicionar sua conta a um grupo de autorização. O menu será atualizado de acordo com as permissões desse grupo.</p>
       {mode === "cliente_autonomo" && !snapshot.user?.organizationId ? <Button onClick={() => navigate({ to: "/app/organization" })}>Vincular empresa</Button> : null}
      </CardContent>
     </Card>
    ) : null}

    {action === "open_app" && (hasDashboardClaim || nextAuthorizedPath) ? (
     <Card>
      <CardHeader><CardTitle>Seu acesso está configurado</CardTitle><CardDescription>Você verá no menu apenas os módulos permitidos pelas suas claims.</CardDescription></CardHeader>
      <CardContent><Button onClick={() => navigate({ to: (hasDashboardClaim ? "/app" : nextAuthorizedPath) as never })}>Continuar para o sistema <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent>
     </Card>
    ) : null}

    <Card className="border-dashed bg-white">
     <CardContent className="p-5 text-sm text-slate-600">As permissões vêm dos grupos configurados pela empresa. O tipo de cadastro orienta estes passos, mas não libera telas nem dados por si só.</CardContent>
    </Card>
   </main>
  </div>
 );
}
