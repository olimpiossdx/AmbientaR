import type React from "react";

export type AppShellNavItem = {
 to: "/app" | "/app/exemplos";
 label: React.ReactNode;
 icon?: React.ComponentType<{ className?: string }>;
 disabled?: boolean;
};

export type AppUserMenuItem = {
 label: React.ReactNode;
 onSelect?: () => void;
 disabled?: boolean;
 destructive?: boolean;
};

export type AppNotificationItem = {
 id: string;
 title: React.ReactNode;
 description?: React.ReactNode;
 isRead?: boolean;
 onSelect?: () => void;
};

export interface AppSidebarProps extends React.HTMLAttributes<HTMLElement> {
 brandName: React.ReactNode;
 brandDescription?: React.ReactNode;
 logo?: React.ReactNode;
 items: AppShellNavItem[];
 userSummary?: React.ReactNode;
 onNavigate?: () => void;
 mobile?: boolean;
 onClose?: () => void;
}

export interface AppHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
 title: React.ReactNode;
 subtitle?: React.ReactNode;
 roleLabel?: React.ReactNode;
 userName?: React.ReactNode;
 userIdentifier?: React.ReactNode;
 onOpenMenu?: () => void;
 userMenu?: React.ReactNode;
 notifications?: React.ReactNode;
 actions?: React.ReactNode;
}

export interface AppUserMenuProps extends React.HTMLAttributes<HTMLDivElement> {
 name: React.ReactNode;
 identifier?: React.ReactNode;
 avatarFallback?: string;
 items?: AppUserMenuItem[];
}

export interface NotificationMenuProps extends React.HTMLAttributes<HTMLDivElement> {
 items?: AppNotificationItem[];
 emptyMessage?: React.ReactNode;
}
