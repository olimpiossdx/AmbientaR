import type React from 'react';
export interface StepperStep { title: React.ReactNode; description?: React.ReactNode; disabled?: boolean; }
export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> { steps: StepperStep[]; index?: number; defaultIndex?: number; onIndexChange?: (index: number) => void; }
