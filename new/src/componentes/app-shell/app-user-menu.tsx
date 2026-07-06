import React from "react";
import { Avatar } from "../avatar";
import { DropdownMenu } from "../dropdown-menu";
import { cn } from "../../utils/cn";
import type { AppUserMenuProps } from "./app-shell.types";

export const AppUserMenu = React.forwardRef<HTMLDivElement, AppUserMenuProps>(({
 name,
 identifier,
 avatarFallback,
 items = [],
 className,
 ...props
}, ref) => (
 <DropdownMenu
  ref={ref}
  className={cn("w-56", className)}
  trigger={(
   <span className="inline-flex items-center gap-2 rounded-md p-1 text-left hover:bg-slate-100">
    <Avatar size="sm" fallback={avatarFallback} alt={typeof name === "string" ? name : ""} />
    <span className="hidden min-w-0 flex-col text-sm md:flex">
     <span className="truncate font-semibold text-slate-900">{name}</span>
     {identifier ? <span className="truncate text-xs text-slate-500">{identifier}</span> : null}
    </span>
   </span>
  )}
  items={items}
  {...props}
 />
));

AppUserMenu.displayName = "AppUserMenu";
