import type React from "react";

export type MetricTone = "emerald" | "amber" | "red" | "blue" | "slate";

export type MetricGridColumns = "three" | "four";

export type MetricGridItem = {
 label: React.ReactNode;
 value: React.ReactNode;
 detail?: React.ReactNode;
 tone?: MetricTone;
 icon?: React.ComponentType<{ className?: string }>;
};

export interface MetricGridProps extends React.HTMLAttributes<HTMLDivElement> {
 metrics: MetricGridItem[];
 columns?: MetricGridColumns;
}
