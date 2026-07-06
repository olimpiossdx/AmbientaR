import { Bell } from "lucide-react";
import React from "react";
import { DropdownMenu } from "../dropdown-menu";
import { cn } from "../../utils/cn";
import type { NotificationMenuProps } from "./app-shell.types";

export const NotificationMenu = React.forwardRef<HTMLDivElement, NotificationMenuProps>(({
 items = [],
 emptyMessage = "Nenhuma notificacao nova.",
 className,
 ...props
}, ref) => {
 const unreadCount = items.filter((item) => !item.isRead).length;
 const menuItems = items.length > 0
  ? items.map((item) => ({
   label: (
    <span className={cn("flex flex-col gap-1", !item.isRead && "font-medium text-slate-950")}>
     <span>{item.title}</span>
     {item.description ? <span className="text-xs font-normal text-slate-500">{item.description}</span> : null}
    </span>
   ),
   onSelect: item.onSelect,
  }))
  : [{ label: <span className="text-sm text-slate-500">{emptyMessage}</span>, disabled: true }];

 return (
  <DropdownMenu
   ref={ref}
   className={cn("w-80", className)}
   trigger={(
    <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100">
     <Bell className="h-5 w-5" />
     {unreadCount > 0 ? (
      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
     ) : null}
     <span className="sr-only">Notificacoes</span>
    </span>
   )}
   items={menuItems}
   {...props}
  />
 );
});

NotificationMenu.displayName = "NotificationMenu";
