import type React from 'react';
export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: React.ReactNode; showValue?: boolean; invalid?: boolean; containerClassName?: string; }
