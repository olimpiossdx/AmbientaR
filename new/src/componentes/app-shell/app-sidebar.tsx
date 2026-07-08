import { ChevronDown, Leaf, X } from "lucide-react";
import React from "react";
import Button from "../button";
import { Sidebar } from "../sidebar";
import { cn } from "../../utils/cn";
import type { AppShellNavItem, AppSidebarProps } from "./app-shell.types";

function isItemActive(item: AppShellNavItem) {
 if (typeof window === "undefined" || !item.to) return false;
 const pathname = window.location.pathname;
 return pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
}

function hasActiveChild(item: AppShellNavItem): boolean {
 return Boolean(item.children?.some((child) => isItemActive(child) || hasActiveChild(child)));
}

function SidebarNavItem({ item, level = 0, onNavigate }: {
 item: AppShellNavItem;
 level?: number;
 onNavigate?: () => void;
}) {
 const Icon = item.icon;
 const hasChildren = Boolean(item.children?.length);
 const active = isItemActive(item);
 const childActive = hasActiveChild(item);
 const [open, setOpen] = React.useState(childActive);
 const disabled = item.disabled || (!item.to && !hasChildren);
 const paddingStyle = { paddingLeft: `${0.75 + level * 0.9}rem` };

 if (hasChildren) {
  return (
   <details className="group/nav" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary
     className={cn(
      "flex h-10 cursor-pointer list-none items-center gap-3 rounded-md pr-3 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800",
      childActive && "bg-emerald-50 text-emerald-900"
     )}
     style={paddingStyle}
    >
     {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
     <span className="min-w-0 flex-1 truncate">{item.label}</span>
     <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open/nav:rotate-180" />
    </summary>
    <div className="mt-1 space-y-1">
     {item.children?.map((child, index) => (
      <SidebarNavItem
       key={`${String(child.label)}-${child.to ?? child.legacyHref ?? index}`}
       item={child}
       level={level + 1}
       onNavigate={onNavigate}
      />
     ))}
    </div>
   </details>
  );
 }

 if (disabled) {
  return (
   <div
    className="flex h-10 items-center gap-3 rounded-md pr-3 text-sm font-medium text-slate-400"
    style={paddingStyle}
    aria-disabled="true"
    title={item.legacyHref ? `Legado: ${item.legacyHref}` : undefined}
   >
    {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
    <span className="min-w-0 truncate">{item.label}</span>
   </div>
  );
 }

 return (
  <a
   href={item.to}
   className={cn(
    "flex h-10 items-center gap-3 rounded-md pr-3 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800",
    active && "bg-emerald-100 text-emerald-900"
   )}
   style={paddingStyle}
   onClick={onNavigate}
  >
   {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
   <span className="min-w-0 truncate">{item.label}</span>
  </a>
 );
}

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
   {items.map((item, index) => (
    <SidebarNavItem
     key={`${String(item.label)}-${item.to ?? item.legacyHref ?? index}`}
     item={item}
     onNavigate={onNavigate}
    />
   ))}
  </nav>

  {userSummary ? <div className="border-t border-slate-200 p-4">{userSummary}</div> : null}
 </Sidebar>
));

AppSidebar.displayName = "AppSidebar";
