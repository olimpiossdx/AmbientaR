import type React from 'react';
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> { value?: number; max?: number; showValue?: boolean; }
