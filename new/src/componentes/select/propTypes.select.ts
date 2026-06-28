import type React from 'react';

export interface SelectOption {
 label: React.ReactNode;
 value: string;
 disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
 label?: React.ReactNode;
 placeholder?: string;
 options?: SelectOption[];
 invalid?: boolean;
 fullWidth?: boolean;
 containerClassName?: string;
}
