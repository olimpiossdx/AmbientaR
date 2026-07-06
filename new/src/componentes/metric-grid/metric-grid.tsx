import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { cn } from "../../utils/cn";
import type { MetricGridProps, MetricTone } from "./metric-grid.types";

const toneClasses = {
 emerald: {
  card: "border-emerald-200 bg-emerald-50 text-emerald-900",
  icon: "bg-emerald-100 text-emerald-700",
 },
 amber: {
  card: "border-amber-200 bg-amber-50 text-amber-950",
  icon: "bg-amber-100 text-amber-700",
 },
 red: {
  card: "border-red-200 bg-red-50 text-red-950",
  icon: "bg-red-100 text-red-700",
 },
 blue: {
  card: "border-sky-200 bg-sky-50 text-sky-950",
  icon: "bg-sky-100 text-sky-700",
 },
 slate: {
  card: "border-slate-200 bg-white text-slate-950",
  icon: "bg-slate-100 text-slate-700",
 },
} satisfies Record<MetricTone, Record<"card" | "icon", string>>;

export const MetricGrid = React.forwardRef<HTMLDivElement, MetricGridProps>(({
 metrics,
 columns = "four",
 className,
 ...props
}, ref) => (
 <div
  ref={ref}
  className={cn("grid gap-4", columns === "three" ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4", className)}
  {...props}
 >
  {metrics.map((metric, index) => {
   const tone = metric.tone ?? "slate";
   const Icon = metric.icon;

   return (
    <Card key={`${String(metric.label)}-${index}`} className={cn("border shadow-sm", toneClasses[tone].card)}>
     <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
      <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
      {Icon ? (
       <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClasses[tone].icon)}>
        <Icon className="h-4 w-4" />
       </span>
      ) : null}
     </CardHeader>
     <CardContent>
      <div className="text-2xl font-semibold">{metric.value}</div>
      {metric.detail ? <p className="mt-1 text-xs opacity-75">{metric.detail}</p> : null}
     </CardContent>
    </Card>
   );
  })}
 </div>
));

MetricGrid.displayName = "MetricGrid";
