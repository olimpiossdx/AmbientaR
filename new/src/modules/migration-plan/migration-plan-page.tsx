import {
 Badge,
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
 PageHeader,
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "../../componentes";
import { migrationModules, migrationPhases, migrationSummary, type MigrationStatus } from "./migration-plan-data";

const statusLabels: Record<MigrationStatus, string> = {
 mapped: "Mapeado",
 in_progress: "Em andamento",
 pending: "Pendente",
};

const statusVariants: Record<MigrationStatus, "success" | "warning" | "outline"> = {
 mapped: "success",
 in_progress: "warning",
 pending: "outline",
};

export function MigrationPlanPage() {
 return (
  <div className="min-h-full bg-slate-100">
   <PageHeader
    eyebrow="Arquitetura modular"
    title="Plano de ação da migração"
    description="Mapa operacional para migrar todas as funcionalidades do projeto antigo para o novo padrão modular."
   />

   <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
    <section className="grid gap-4 md:grid-cols-4">
     <Card>
      <CardHeader>
       <CardTitle className="text-sm">Módulos</CardTitle>
      </CardHeader>
      <CardContent>
       <div className="text-2xl font-semibold">{migrationSummary.totalModules}</div>
      </CardContent>
     </Card>
     <Card>
      <CardHeader>
       <CardTitle className="text-sm">Funcionalidades</CardTitle>
      </CardHeader>
      <CardContent>
       <div className="text-2xl font-semibold">{migrationSummary.totalFeatures}</div>
      </CardContent>
     </Card>
     <Card>
      <CardHeader>
       <CardTitle className="text-sm">Em andamento</CardTitle>
      </CardHeader>
      <CardContent>
       <div className="text-2xl font-semibold">{migrationSummary.inProgressFeatures}</div>
      </CardContent>
     </Card>
     <Card>
      <CardHeader>
       <CardTitle className="text-sm">Mapeadas</CardTitle>
      </CardHeader>
      <CardContent>
       <div className="text-2xl font-semibold">{migrationSummary.mappedFeatures}</div>
      </CardContent>
     </Card>
    </section>

    <section className="grid gap-4 xl:grid-cols-5">
     {migrationPhases.map((phase) => (
      <Card key={phase.title}>
       <CardHeader>
        <CardTitle className="text-base">{phase.title}</CardTitle>
        <CardDescription>{phase.goal}</CardDescription>
       </CardHeader>
       <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
         {phase.modules.map((module) => (
          <Badge key={module} variant="outline">{module}</Badge>
         ))}
        </div>
        <ul className="space-y-1 pl-4 text-sm text-slate-600">
         {phase.deliverables.map((deliverable) => (
          <li key={deliverable}>{deliverable}</li>
         ))}
        </ul>
       </CardContent>
      </Card>
     ))}
    </section>

    <section className="space-y-5">
     {migrationModules.map((module) => (
      <Card key={module.name}>
       <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
         <div>
          <CardTitle>{module.priority}. {module.name}</CardTitle>
          <CardDescription>{module.objective}</CardDescription>
         </div>
         <Badge variant="secondary">{module.folder}</Badge>
        </div>
       </CardHeader>
       <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
         <div>
          <h3 className="text-sm font-semibold text-slate-900">Dependências</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
           {module.dependencies.map((dependency) => (
            <Badge key={dependency} variant="outline">{dependency}</Badge>
           ))}
          </div>
         </div>
         <div>
          <h3 className="text-sm font-semibold text-slate-900">Critérios de aceite</h3>
          <ul className="mt-2 space-y-1 pl-4 text-sm text-slate-600">
           {module.acceptance.map((item) => (
            <li key={item}>{item}</li>
           ))}
          </ul>
         </div>
        </div>

        <Table aria-label={`Funcionalidades do modulo ${module.name}`}>
         <TableHeader>
          <TableRow>
           <TableHead>Funcionalidade</TableHead>
           <TableHead>Rota antiga</TableHead>
           <TableHead>Módulo/pasta</TableHead>
           <TableHead>Front</TableHead>
           <TableHead>API</TableHead>
           <TableHead>Validações</TableHead>
           <TableHead>Status</TableHead>
          </TableRow>
         </TableHeader>
         <TableBody>
          {module.features.map((feature) => (
           <TableRow key={`${module.name}-${feature.name}-${feature.legacyRoute}`}>
            <TableCell className="font-medium text-slate-900">{feature.name}</TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs">{feature.legacyRoute}</TableCell>
            <TableCell>{feature.targetModule}</TableCell>
            <TableCell>{feature.frontScope}</TableCell>
            <TableCell>{feature.apiScope}</TableCell>
            <TableCell>{feature.validations}</TableCell>
            <TableCell>
             <Badge variant={statusVariants[feature.status]}>{statusLabels[feature.status]}</Badge>
            </TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
       </CardContent>
      </Card>
     ))}
    </section>
   </main>
  </div>
 );
}
