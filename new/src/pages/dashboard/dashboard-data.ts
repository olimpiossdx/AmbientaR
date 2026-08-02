import {
 AlertTriangle,
 CalendarDays,
 CheckCircle2,
 Clock3,
 CreditCard,
 FileSearch,
 FolderKanban,
 LineChart,
 Recycle,
 ShieldCheck,
 TrendingUp,
 UsersRound,
 WalletCards,
 Waves,
 type LucideIcon,
} from "lucide-react";
import type { HubGridItem, MetricGridItem, ProcessTableRow, TaskListItem } from "../../componentes";
import type {
 DashboardHubItem,
 DashboardIcon,
 DashboardMetric,
 DashboardProcess,
 DashboardTask,
} from "./dashboard.types";

const iconByName: Record<DashboardIcon, LucideIcon> = {
 alert: AlertTriangle,
 calendar: CalendarDays,
 check: CheckCircle2,
 clock: Clock3,
 "credit-card": CreditCard,
 "file-search": FileSearch,
 folder: FolderKanban,
 "line-chart": LineChart,
 recycle: Recycle,
 shield: ShieldCheck,
 "trending-up": TrendingUp,
 users: UsersRound,
 wallet: WalletCards,
 waves: Waves,
};

export function toMetricGridItems(items: DashboardMetric[]): MetricGridItem[] {
 return items.map((item) => ({
  label: item.label,
  value: item.value,
  detail: item.detail,
  tone: item.tone,
  icon: item.icon ? iconByName[item.icon] : undefined,
 }));
}

export function toTaskListItems(items: DashboardTask[]): TaskListItem[] {
 return items.map((item) => ({
  title: item.title,
  detail: item.detail,
  status: item.status,
 }));
}

export function toProcessTableRows(items: DashboardProcess[]): ProcessTableRow[] {
 return items.map((item) => ({
  id: item.id,
  process: item.process,
  subject: item.subject,
  status: item.status,
  dueDate: item.dueDate,
  tone: item.tone,
 }));
}

export function toHubGridItems(items: DashboardHubItem[]): HubGridItem[] {
 return items.map((item) => ({
  label: item.label,
  detail: item.detail,
  icon: item.icon ? iconByName[item.icon] : undefined,
 }));
}
