import React from 'react';
import { cn } from '../../utils/cn';
import type { ChartConfig, ChartContainerProps } from './chart.types';
const ChartConfigContext = React.createContext<ChartConfig>({});
export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(({ config = {}, className, children, ...props }, ref) => <ChartConfigContext.Provider value={config}><div ref={ref} className={cn('rounded-lg border border-gray-200 bg-white p-4', className)} {...props}>{children}</div></ChartConfigContext.Provider>);
export const ChartLegend = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => { const config = React.useContext(ChartConfigContext); return <div ref={ref} className={cn('flex flex-wrap gap-3 text-sm', className)} {...props}>{Object.entries(config).map(([key, item]) => <span key={key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? 'currentColor' }} />{item.icon}{item.label ?? key}</span>)}</div>; });
export const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md', className)} {...props} />);
ChartContainer.displayName = 'ChartContainer'; ChartLegend.displayName = 'ChartLegend'; ChartTooltip.displayName = 'ChartTooltip';
