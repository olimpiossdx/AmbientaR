import type React from 'react';
export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string; icon?: React.ReactNode; formatter?: (value: unknown) => React.ReactNode }>;
export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> { config?: ChartConfig; }
