import type React from 'react';
export interface SignaturePadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> { name: string; width?: number; height?: number; disabled?: boolean; clearLabel?: string; showClear?: boolean; strokeStyle?: string; lineWidth?: number; onChange?: (dataUrl: string) => void; }
