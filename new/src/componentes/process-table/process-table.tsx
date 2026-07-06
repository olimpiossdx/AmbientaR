import React from "react";
import { Badge } from "../badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { cn } from "../../utils/cn";
import type { ProcessTableProps } from "./process-table.types";

const statusToneClasses = {
 emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
 amber: "border-amber-200 bg-amber-50 text-amber-900",
 red: "border-red-200 bg-red-50 text-red-800",
 blue: "border-sky-200 bg-sky-50 text-sky-800",
 slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export const ProcessTable = React.forwardRef<HTMLDivElement, ProcessTableProps>(({
 title,
 description,
 rows,
 emptyMessage = "Nenhum processo encontrado.",
 className,
 ...props
}, ref) => (
 <Card ref={ref} className={className} {...props}>
  <CardHeader>
   <CardTitle>{title}</CardTitle>
   {description ? <CardDescription>{description}</CardDescription> : null}
  </CardHeader>
  <CardContent>
   <Table aria-label={typeof title === "string" ? title : "Tabela de processos"}>
    <TableHeader>
     <TableRow>
      <TableHead>Processo</TableHead>
      <TableHead>Assunto</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Prazo</TableHead>
     </TableRow>
    </TableHeader>
    <TableBody>
     {rows.map((row, index) => {
      const tone = row.tone ?? "slate";

      return (
       <TableRow key={row.id ?? `${String(row.process)}-${index}`}>
        <TableCell className="font-medium text-slate-900">{row.process}</TableCell>
        <TableCell>{row.subject}</TableCell>
        <TableCell>
         <Badge variant="outline" className={cn(statusToneClasses[tone])}>{row.status}</Badge>
        </TableCell>
        <TableCell>{row.dueDate}</TableCell>
       </TableRow>
      );
     })}
     {rows.length === 0 ? (
      <TableRow>
       <TableCell colSpan={4} className="h-24 text-center text-slate-500">{emptyMessage}</TableCell>
      </TableRow>
     ) : null}
    </TableBody>
   </Table>
  </CardContent>
 </Card>
));

ProcessTable.displayName = "ProcessTable";
