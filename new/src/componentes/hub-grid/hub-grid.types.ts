import type React from "react";

export type HubGridItem = {
 label: React.ReactNode;
 detail?: React.ReactNode;
 icon?: React.ComponentType<{ className?: string }>;
 action?: React.ReactNode;
};

export interface HubGridProps extends React.HTMLAttributes<HTMLDivElement> {
 items: HubGridItem[];
}
