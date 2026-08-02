export const DASHBOARD_VIEW_CLAIM = {
 claimType: "recurso.dashboard",
 claimValue: "visualizar",
} as const;

export type DashboardTone = "emerald" | "amber" | "red" | "blue" | "slate";
export type DashboardIcon =
 | "alert"
 | "calendar"
 | "check"
 | "clock"
 | "credit-card"
 | "file-search"
 | "folder"
 | "line-chart"
 | "recycle"
 | "shield"
 | "trending-up"
 | "users"
 | "wallet"
 | "waves";

export type DashboardMetric = {
 id: string;
 label: string;
 value: string;
 detail?: string;
 tone?: DashboardTone;
 icon?: DashboardIcon;
};

export type DashboardTask = {
 id: string;
 title: string;
 detail?: string;
 status?: string;
};

export type DashboardProcess = {
 id: string;
 process: string;
 subject: string;
 status: string;
 dueDate: string;
 tone?: DashboardTone;
};

export type DashboardHubItem = {
 id: string;
 label: string;
 detail?: string;
 icon?: DashboardIcon;
};

export type DashboardWidget =
 | {
  id: string;
  kind: "metrics";
  title?: string;
  columns?: 3 | 4;
  items: DashboardMetric[];
 }
 | {
  id: string;
  kind: "tasks";
  title: string;
  description?: string;
  emptyMessage?: string;
  items: DashboardTask[];
 }
 | {
  id: string;
  kind: "processes";
  title: string;
  description?: string;
  emptyMessage?: string;
  items: DashboardProcess[];
 }
 | {
  id: string;
  kind: "hub";
  title?: string;
  items: DashboardHubItem[];
 };

export type DashboardDto = {
 title: string;
 description?: string;
 widgets: DashboardWidget[];
 generatedAt?: string;
};
