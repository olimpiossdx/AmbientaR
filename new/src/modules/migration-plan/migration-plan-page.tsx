import { useEffect, useMemo, useState } from "react";
import catalogMarkdown from "../../../docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md?raw";
import inventoryMarkdown from "../../../docs/INVENTARIO-COMPLETO-TELAS-ROTAS.md?raw";
import {
 Badge,
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
 PageHeader,
 Progress,
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "../../componentes";
import {
 executionSteps,
 canComplete,
 initializeProgress,
 migrationBaseline,
 migrationWaves,
 parseFeatureCatalog,
 sourceDocuments,
 summarizeProgress,
 type ExecutionProgress,
 type MigrationStatus,
} from "./migration-plan-data";
import { buildMigrationCoverage } from "./migration-coverage";

const STORAGE_KEY = "ambientar:migration-plan:v2";
const catalog = parseFeatureCatalog(catalogMarkdown);
const routeSources = import.meta.glob(["../../router.tsx", "../**/*.routes.tsx"], {
 eager: true,
 query: "?raw",
 import: "default",
}) as Record<string, string>;
const coverage = buildMigrationCoverage(inventoryMarkdown, catalog, routeSources);

const statusLabels: Record<MigrationStatus, string> = {
 pending: "Pendente",
 in_progress: "Em execução",
 blocked: "Bloqueada",
 done: "Concluída",
};

const statusVariants: Record<MigrationStatus, "outline" | "warning" | "error" | "success"> = {
 pending: "outline",
 in_progress: "warning",
 blocked: "error",
 done: "success",
};

function loadProgress(): Record<string, ExecutionProgress> {
 try {
  return initializeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, ExecutionProgress>);
 } catch {
  return initializeProgress({});
 }
}

export function MigrationPlanPage() {
 const [progress, setProgress] = useState<Record<string, ExecutionProgress>>(loadProgress);
 const [query, setQuery] = useState("");
 const [wave, setWave] = useState("all");
 const [status, setStatus] = useState<MigrationStatus | "all">("all");
 const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? "");

 useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)), [progress]);

 const summary = useMemo(() => summarizeProgress(catalog, progress), [progress]);
 const filtered = useMemo(() => {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  return catalog.filter((feature) => {
   const featureStatus = progress[feature.id]?.status ?? "pending";
   const searchable = [feature.id, feature.name, feature.group, feature.routes, feature.api, feature.claims].join(" ").toLocaleLowerCase("pt-BR");
   return (wave === "all" || feature.wave === Number(wave))
    && (status === "all" || featureStatus === status)
    && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
 }, [progress, query, status, wave]);
 const selected = catalog.find((feature) => feature.id === selectedId);
 const selectedProgress = selected ? progress[selected.id] ?? { status: "pending", completedSteps: [] } : undefined;
 const selectedRouteCoverage = selected ? coverage.featureRoutes[selected.id] : undefined;

 const updateFeature = (id: string, update: Partial<ExecutionProgress>) => {
  setProgress((current) => {
   const previous: ExecutionProgress = current[id] ?? { status: "pending", completedSteps: [] };
   const candidate = { ...previous, ...update };
   const hasConcreteRoute = coverage.featureRoutes[id]?.hasConcreteRoute ?? false;
   const safeStatus = candidate.status === "done" && (!canComplete(candidate) || !hasConcreteRoute) ? (candidate.completedSteps.length ? "in_progress" : "pending") : candidate.status;
   return { ...current, [id]: { ...candidate, status: safeStatus } };
  });
 };

 const toggleStep = (step: number) => {
  if (!selected || !selectedProgress) return;
  const completedSteps = selectedProgress.completedSteps.includes(step)
   ? selectedProgress.completedSteps.filter((item) => item !== step)
   : [...selectedProgress.completedSteps, step].sort((a, b) => a - b);
  const nextStatus: MigrationStatus = completedSteps.length === executionSteps.length && Boolean(selectedProgress.evidence?.trim())
   && selectedRouteCoverage?.hasConcreteRoute ? "done"
   : completedSteps.length > 0 && selectedProgress.status === "pending" ? "in_progress" : selectedProgress.status;
  updateFeature(selected.id, { completedSteps, status: nextStatus });
 };

 return (
  <div className="min-h-full bg-slate-100">
   <PageHeader
    eyebrow="Execução new + ambientaR-api"
    title="Painel executável da migração"
    description="Controle por funcionalidade FUN-*, claims, contrato de API, ondas, critérios e evidências. Toda decisão normativa usa claim e escopo."
   />

   <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
    {catalog.length !== migrationBaseline.catalogFeatures && (
     <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
      Gate de catálogo falhou: foram lidas {catalog.length} funcionalidades; o documento normativo exige {migrationBaseline.catalogFeatures}.
     </div>
    )}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Linha de base e progresso">
     {[
      ["FUN-* catalogadas", `${summary.total}/${migrationBaseline.catalogFeatures}`],
      ["Variações a homologar", migrationBaseline.totalRouteVariations],
      ["Concluídas", summary.done],
      ["Em execução", summary.inProgress],
      ["Bloqueadas", summary.blocked],
      ["Passos verificados", `${summary.completedSteps}/${summary.totalSteps}`],
     ].map(([label, value]) => (
      <Card key={label}>
       <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
       <CardContent><div className="text-2xl font-semibold">{value}</div></CardContent>
      </Card>
     ))}
    </section>

    <Card>
     <CardHeader>
      <CardTitle>Gate global de cobertura</CardTitle>
      <CardDescription>Rotas concretas são descobertas no TanStack Router. A rota catch-all é contabilizada separadamente e não vale como implementação.</CardDescription>
     </CardHeader>
     <CardContent className="space-y-3">
      <Progress value={summary.total ? (summary.done / summary.total) * 100 : 0} />
      <div className="flex flex-wrap gap-2 text-xs">
       <Badge variant="outline">{migrationBaseline.canonicalUrls} URLs canônicas</Badge>
       <Badge variant="outline">{migrationBaseline.routePatterns} padrões reais</Badge>
       <Badge variant="outline">{migrationBaseline.authenticatedRoutePatterns} autenticados</Badge>
       <Badge variant="outline">{migrationBaseline.removedAliases} aliases removidos</Badge>
       <Badge variant="success">{coverage.inventoryPatternsImplemented}/{coverage.inventoryPatternsTotal} padrões com rota concreta</Badge>
       <Badge variant="success">{coverage.inventoryVariationsImplemented}/{coverage.inventory.length} variações cobertas</Badge>
       <Badge variant={coverage.catchAllRoutes.length ? "warning" : "outline"}>{coverage.catchAllRoutes.length} catch-all (não cobre inventário)</Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
       {sourceDocuments.map((document) => (
        <div key={document.id} className="rounded-md border bg-white p-3">
         <div className="font-mono text-xs text-slate-500">{document.id}</div>
         <div className="font-medium">{document.label}</div>
         <div className="break-all font-mono text-xs text-slate-600">{document.path}</div>
        </div>
       ))}
      </div>
     </CardContent>
    </Card>

    <Card>
     <CardHeader><CardTitle>Ondas de execução</CardTitle><CardDescription>Dependências são gates; funcionalidades independentes da mesma onda podem avançar em paralelo.</CardDescription></CardHeader>
     <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {migrationWaves.map((item) => (
       <button key={item.id} type="button" onClick={() => setWave(String(item.id))} className="rounded-lg border bg-white p-3 text-left transition hover:border-emerald-500 hover:shadow-sm">
        <div className="flex items-center justify-between gap-2"><strong>Onda {item.id} · {item.title}</strong><Badge variant="outline">{catalog.filter((feature) => feature.wave === item.id).length} FUN</Badge></div>
        <div className="mt-2 font-mono text-xs text-emerald-800">{item.featureIds}</div>
        <div className="mt-1 text-xs text-slate-600">Gate: {item.dependencies}</div>
       </button>
      ))}
     </CardContent>
    </Card>

    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,1fr)]">
     <Card>
      <CardHeader>
       <CardTitle>Backlog vertical</CardTitle>
       <CardDescription>Cada linha é uma entrega completa: claim → menu → rota → tela → API → escopo → testes → aceite.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
       <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px]">
        <label className="text-sm font-medium">Buscar FUN, menu, rota, API ou claim
         <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-md border bg-white px-3 py-2 font-normal" placeholder="Ex.: FUN-DOC-006 ou recurso.licenca" />
        </label>
        <label className="text-sm font-medium">Onda
         <select value={wave} onChange={(event) => setWave(event.target.value)} className="mt-1 w-full rounded-md border bg-white px-3 py-2 font-normal">
          <option value="all">Todas</option>{migrationWaves.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
         </select>
        </label>
        <label className="text-sm font-medium">Status
         <select value={status} onChange={(event) => setStatus(event.target.value as MigrationStatus | "all")} className="mt-1 w-full rounded-md border bg-white px-3 py-2 font-normal">
          <option value="all">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
         </select>
        </label>
       </div>

       <div className="max-h-[760px] overflow-auto rounded-md border">
        <Table aria-label="Catálogo executável de funcionalidades">
         <TableHeader><TableRow><TableHead>ID/menu</TableHead><TableHead>Rotas</TableHead><TableHead>API e claims</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
         <TableBody>
          {filtered.map((feature) => {
           const featureProgress = progress[feature.id] ?? { status: "pending", completedSteps: [] };
           return (
            <TableRow key={feature.id} id={feature.id} className={selectedId === feature.id ? "bg-emerald-50" : undefined}>
             <TableCell><button type="button" onClick={() => setSelectedId(feature.id)} className="text-left"><span className="font-mono text-xs font-semibold text-emerald-800">{feature.id}</span><span className="block font-medium text-slate-900">{feature.name}</span><span className="block text-xs text-slate-500">Onda {feature.wave} · {feature.group}</span></button></TableCell>
             <TableCell className="max-w-64 break-words font-mono text-xs">{feature.routes}</TableCell>
             <TableCell className="max-w-80"><div className="text-xs">{feature.api}</div><div className="mt-1 font-mono text-xs text-emerald-800">{feature.claims}</div></TableCell>
             <TableCell><Badge variant={statusVariants[featureProgress.status]}>{statusLabels[featureProgress.status]}</Badge><div className="mt-1 text-xs text-slate-500">{featureProgress.completedSteps.length}/10 passos</div></TableCell>
            </TableRow>
           );
          })}
         </TableBody>
        </Table>
        {!filtered.length && <div className="p-8 text-center text-sm text-slate-500">Nenhuma funcionalidade corresponde aos filtros.</div>}
       </div>
      </CardContent>
     </Card>

     <Card className="xl:sticky xl:top-4">
      <CardHeader>
       <CardTitle>{selected ? `${selected.id} · ${selected.name}` : "Selecione uma funcionalidade"}</CardTitle>
       {selected && <CardDescription>Onda {selected.wave} · {selected.group}</CardDescription>}
      </CardHeader>
      {selected && selectedProgress && (
       <CardContent className="space-y-4">
        <label className="block text-sm font-medium">Status
         <select value={selectedProgress.status} onChange={(event) => updateFeature(selected.id, { status: event.target.value as MigrationStatus })} className="mt-1 w-full rounded-md border bg-white px-3 py-2 font-normal">
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value} disabled={value === "done" && (!canComplete(selectedProgress) || !selectedRouteCoverage?.hasConcreteRoute)}>{label}</option>)}
         </select>
        </label>
        {!canComplete(selectedProgress) && <p className="text-xs text-amber-800">Para concluir, verifique os 10 passos e informe uma evidência não vazia.</p>}
        {!selectedRouteCoverage?.hasConcreteRoute && (
         <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Gate de rota pendente.</strong> Uma funcionalidade só pode ser concluída quando todas as rotas catalogadas possuem definição concreta no TanStack Router.
          {!!selectedRouteCoverage?.missing.length && <span className="mt-1 block break-all font-mono">Faltam: {selectedRouteCoverage.missing.join(", ")}</span>}
         </div>
        )}
        <div className="rounded-md border bg-slate-50 p-3 text-sm"><strong>Critério específico</strong><p className="mt-1 text-slate-600">{selected.acceptance}</p></div>
        <div className="max-h-[500px] space-y-2 overflow-auto pr-1">
         {executionSteps.map((step) => {
          const checked = selectedProgress.completedSteps.includes(step.id);
          return (
           <label key={step.id} className="flex cursor-pointer gap-3 rounded-md border bg-white p-3">
            <input type="checkbox" checked={checked} onChange={() => toggleStep(step.id)} className="mt-1 size-4 accent-emerald-700" />
            <span><strong className="text-sm">{step.id}. {step.title}</strong><span className="mt-1 block text-xs text-slate-600">{step.acceptance.join(" · ")}</span><span className="mt-1 block text-xs font-medium text-emerald-800">Saída: {step.output}</span></span>
           </label>
          );
         })}
        </div>
        <label className="block text-sm font-medium">Evidência / link / identificador
         <textarea value={selectedProgress.evidence ?? ""} onChange={(event) => updateFeature(selected.id, { evidence: event.target.value })} className="mt-1 min-h-20 w-full rounded-md border bg-white px-3 py-2 font-normal" placeholder="PR, teste, contrato, decisão ou URL de evidência" />
        </label>
       </CardContent>
      )}
     </Card>
    </section>
   </main>
  </div>
 );
}
