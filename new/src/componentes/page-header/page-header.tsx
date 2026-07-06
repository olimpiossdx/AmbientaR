import React from "react";
import { cn } from "../../utils/cn";
import type { PageHeaderProps } from "./page-header.types";

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(({
 eyebrow,
 title,
 description,
 actions,
 className,
 ...props
}, ref) => (
 <div ref={ref} className={cn("border-b border-slate-200 bg-white", className)} {...props}>
  <div className="flex min-w-0 flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
   <div className="min-w-0">
    {eyebrow ? (
     <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
    ) : null}
    <h1 className="mt-1 wrap-break-word text-2xl font-semibold text-slate-950">{title}</h1>
    {description ? (
     <p className="mt-1 max-w-3xl wrap-break-word text-sm leading-6 text-slate-600">{description}</p>
    ) : null}
   </div>
   {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
 </div>
));

PageHeader.displayName = "PageHeader";
