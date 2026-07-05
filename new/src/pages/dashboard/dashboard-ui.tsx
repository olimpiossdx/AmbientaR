import type { LucideIcon } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../componentes";
import { cn } from "../../utils/cn";
import type { DashboardMetric, DashboardTableRow, DashboardTask } from "./dashboard-data";

const toneClasses = {
 emerald: {
  metric: "border-emerald-200 bg-emerald-50 text-emerald-900",
  icon: "bg-emerald-100 text-emerald-700",
  badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
 },
 amber: {
  metric: "border-amber-200 bg-amber-50 text-amber-950",
  icon: "bg-amber-100 text-amber-700",
  badge: "border-amber-200 bg-amber-50 text-amber-900",
 },
 red: {
  metric: "border-red-200 bg-red-50 text-red-950",
  icon: "bg-red-100 text-red-700",
  badge: "border-red-200 bg-red-50 text-red-800",
 },
 blue: {
  metric: "border-sky-200 bg-sky-50 text-sky-950",
  icon: "bg-sky-100 text-sky-700",
  badge: "border-sky-200 bg-sky-50 text-sky-800",
 },
 slate: {
  metric: "border-slate-200 bg-white text-slate-950",
  icon: "bg-slate-100 text-slate-700",
  badge: "border-slate-200 bg-slate-50 text-slate-700",
 },
} satisfies Record<DashboardMetric["tone"], Record<"metric" | "icon" | "badge", string>>;

export function PageHeader({ title, description }: { title: string; description: string }) {
 return (
  <div className="border-b border-slate-200 bg-white">
   <div className="px-4 py-5 sm:px-6 lg:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">AmbientaR</p>
    <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
   </div>
  </div>
 );
}

export function MetricGrid({ metrics, columns = "four" }: { metrics: DashboardMetric[]; columns?: "three" | "four" }) {
 return (
  <div className={cn("grid gap-4", columns === "three" ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4")}>
   {metrics.map((metric) => {
    const Icon = metric.icon;

    return (
     <Card key={metric.label} className={cn("border shadow-sm", toneClasses[metric.tone].metric)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
       <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
       <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClasses[metric.tone].icon)}>
        <Icon className="h-4 w-4" />
       </span>
      </CardHeader>
      <CardContent>
       <div className="text-2xl font-semibold">{metric.value}</div>
       <p className="mt-1 text-xs opacity-75">{metric.detail}</p>
      </CardContent>
     </Card>
    );
   })}
  </div>
 );
}

export function HubGrid({ items }: { items: Array<{ label: string; detail: string; icon: LucideIcon }> }) {
 return (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
   {items.map((item) => {
    const Icon = item.icon;

    return (
     <Card key={item.label} className="transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
      <CardHeader className="pb-3">
       <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
        <Icon className="h-4 w-4" />
       </span>
       <CardTitle className="text-base">{item.label}</CardTitle>
       <CardDescription>{item.detail}</CardDescription>
      </CardHeader>
     </Card>
    );
   })}
  </div>
 );
}

export function TaskList({ title, description, items }: { title: string; description: string; items: DashboardTask[] }) {
 return (
  <Card>
   <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
   </CardHeader>
   <CardContent className="space-y-3">
    {items.map((item) => (
     <div key={item.title} className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
       <p className="font-medium text-slate-900">{item.title}</p>
       <Badge variant="outline" className="shrink-0">{item.status}</Badge>
      </div>
      <p className="mt-1 text-sm leading-5 text-slate-600">{item.detail}</p>
     </div>
    ))}
   </CardContent>
  </Card>
 );
}

export function RecentProcessTable({ rows }: { rows: DashboardTableRow[] }) {
 return (
  <Card>
   <CardHeader>
    <CardTitle>Licencas e projetos recentes</CardTitle>
    <CardDescription>Ultimos processos ambientais adicionados ao painel.</CardDescription>
   </CardHeader>
   <CardContent>
    <Table aria-label="Licencas e projetos recentes">
     <TableHeader>
      <TableRow>
       <TableHead>Processo</TableHead>
       <TableHead>Assunto</TableHead>
       <TableHead>Status</TableHead>
       <TableHead>Prazo</TableHead>
      </TableRow>
     </TableHeader>
     <TableBody>
      {rows.map((row) => (
       <TableRow key={row.process}>
        <TableCell className="font-medium text-slate-900">{row.process}</TableCell>
        <TableCell>{row.subject}</TableCell>
        <TableCell>
         <Badge variant="outline" className={toneClasses[row.tone].badge}>{row.status}</Badge>
        </TableCell>
        <TableCell>{row.dueDate}</TableCell>
       </TableRow>
      ))}
     </TableBody>
    </Table>
   </CardContent>
  </Card>
 );
}
