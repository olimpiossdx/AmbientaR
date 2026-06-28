import type React from 'react';

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
 name: string;
 value?: string;
 defaultValue?: string;
 invalid?: boolean;
 onValueChange?: (value: string) => void;
}

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name'> {
 value: string;
 label?: React.ReactNode;
 description?: React.ReactNode;
}
