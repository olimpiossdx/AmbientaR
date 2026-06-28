import type React from 'react';
export interface ResizableProps extends React.HTMLAttributes<HTMLDivElement> { direction?: 'horizontal' | 'vertical' | 'both'; minWidth?: number; minHeight?: number; }
