import React from "react";
import { Badge } from "../badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { cn } from "../../utils/cn";
import type { TaskListProps } from "./task-list.types";

export const TaskList = React.forwardRef<HTMLDivElement, TaskListProps>(({
 title,
 description,
 items,
 emptyMessage = "Nenhum item encontrado.",
 className,
 ...props
}, ref) => (
 <Card ref={ref} className={className} {...props}>
  <CardHeader>
   <CardTitle>{title}</CardTitle>
   {description ? <CardDescription>{description}</CardDescription> : null}
  </CardHeader>
  <CardContent className="space-y-3">
   {items.length === 0 ? <p className="text-sm text-slate-500">{emptyMessage}</p> : null}
   {items.map((item, index) => (
    <div key={`${String(item.title)}-${index}`} className={cn("rounded-md border border-slate-200 p-3", item.action ? "pr-2" : undefined)}>
     <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="font-medium text-slate-900">{item.title}</p>
      {item.status ? <Badge variant="outline" className="shrink-0">{item.status}</Badge> : null}
     </div>
     {item.detail ? <p className="mt-1 text-sm leading-5 text-slate-600">{item.detail}</p> : null}
     {item.action ? <div className="mt-3">{item.action}</div> : null}
    </div>
   ))}
  </CardContent>
 </Card>
));

TaskList.displayName = "TaskList";
