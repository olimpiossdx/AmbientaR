import { Link } from "@tanstack/react-router";
import { Leaf, X } from "lucide-react";
import React from "react";
import Button from "../button";
import { Sidebar } from "../sidebar";
import { cn } from "../../utils/cn";
import type { AppSidebarProps } from "./app-shell.types";

export const AppSidebar = React.forwardRef<HTMLElement, AppSidebarProps>(({
 brandName,
 brandDescription,
 logo,
 items,
 userSummary,
 onNavigate,
 mobile,
 onClose,
 className,
 ...props
}, ref) => (
 <Sidebar
  ref={ref}
  className={cn(mobile ? "h-full w-80 max-w-[86vw]" : "hidden w-72 shrink-0 md:flex", className)}
  {...props}
 >
  <div className={cn("flex h-16 items-center border-b border-slate-200 px-5", mobile ? "justify-between" : "gap-3")}>
   <div className="flex min-w-0 items-center gap-3">
    {logo ?? (
     <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
      <Leaf className="h-5 w-5" />
     </span>
    )}
    <div className="min-w-0">
     <p className="truncate text-base font-semibold text-slate-950">{brandName}</p>
     {brandDescription ? <p className="truncate text-xs text-slate-500">{brandDescription}</p> : null}
    </div>
   </div>
   {mobile ? (
    <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={onClose}>
     <X className="h-5 w-5" />
    </Button>
   ) : null}
  </div>

  <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
   {items.map((item, index) => {
    const Icon = item.icon;

    if (item.disabled) {
     return (
      <div
       key={`${String(item.label)}-${index}`}
       className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400"
       aria-disabled="true"
      >
       {Icon ? <Icon className="h-4 w-4" /> : null}
       <span>{item.label}</span>
      </div>
     );
    }

    return (
     <Link
      key={`${String(item.label)}-${index}`}
      to={item.to}
      className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
      activeProps={{ className: "bg-emerald-100 text-emerald-900" }}
      onClick={onNavigate}
     >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{item.label}</span>
     </Link>
    );
   })}
  </nav>

  {userSummary ? <div className="border-t border-slate-200 p-4">{userSummary}</div> : null}
 </Sidebar>
));

AppSidebar.displayName = "AppSidebar";
