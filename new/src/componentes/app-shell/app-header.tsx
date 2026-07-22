import { Menu, ShieldCheck } from "lucide-react";
import React from "react";
import Button from "../button";
import { Badge } from "../badge";
import { cn } from "../../utils/cn";
import type { AppHeaderProps } from "./app-shell.types";

export const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(({
 title,
 subtitle,
 sessionLabel,
 userName,
 userIdentifier,
 onOpenMenu,
 userMenu,
 notifications,
 actions,
 className,
 ...props
}, ref) => (
 <header
  ref={ref}
  className={cn("flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6", className)}
  {...props}
 >
  <div className="flex min-w-0 items-center gap-3">
   {onOpenMenu ? (
    <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={onOpenMenu}>
     <Menu className="h-5 w-5" />
    </Button>
   ) : null}
   <div className="hidden min-w-0 sm:block">
    <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
    {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
   </div>
  </div>

  <div className="flex min-w-0 items-center gap-3">
   {sessionLabel ? (
    <Badge variant="outline" className="hidden items-center gap-1.5 sm:inline-flex">
     <ShieldCheck className="h-3.5 w-3.5" />
     {sessionLabel}
    </Badge>
   ) : null}
   {notifications}
   <div className="hidden min-w-0 text-right text-xs text-slate-500 sm:block">
    {userName ? <p className="truncate font-semibold text-slate-700">{userName}</p> : null}
    {userIdentifier ? <p className="truncate">{userIdentifier}</p> : null}
   </div>
   {userMenu}
   {actions}
  </div>
 </header>
));

AppHeader.displayName = "AppHeader";
