import type React from "react";
import type { MetricTone } from "../metric-grid";

export type ProcessTableRow = {
 id?: string;
 process: React.ReactNode;
 subject: React.ReactNode;
 status: React.ReactNode;
 dueDate: React.ReactNode;
 tone?: MetricTone;
};

export interface ProcessTableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
 title: React.ReactNode;
 description?: React.ReactNode;
 rows: ProcessTableRow[];
 emptyMessage?: React.ReactNode;
}
