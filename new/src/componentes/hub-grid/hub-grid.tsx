import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../card";
import { cn } from "../../utils/cn";
import type { HubGridProps } from "./hub-grid.types";

export const HubGrid = React.forwardRef<HTMLDivElement, HubGridProps>(({
 items,
 className,
 ...props
}, ref) => (
 <div ref={ref} className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)} {...props}>
  {items.map((item, index) => {
   const Icon = item.icon;

   return (
    <Card key={`${String(item.label)}-${index}`} className="transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
     <CardHeader className="pb-3">
      {Icon ? (
       <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
        <Icon className="h-4 w-4" />
       </span>
      ) : null}
      <CardTitle className="text-base">{item.label}</CardTitle>
      {item.detail ? <CardDescription>{item.detail}</CardDescription> : null}
      {item.action ? <div className="pt-2">{item.action}</div> : null}
     </CardHeader>
    </Card>
   );
  })}
 </div>
));

HubGrid.displayName = "HubGrid";
