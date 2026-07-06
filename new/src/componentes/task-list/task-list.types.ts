import type React from "react";

export type TaskListItem = {
 title: React.ReactNode;
 detail?: React.ReactNode;
 status?: React.ReactNode;
 action?: React.ReactNode;
};

export interface TaskListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
 title: React.ReactNode;
 description?: React.ReactNode;
 items: TaskListItem[];
 emptyMessage?: React.ReactNode;
}
