import type React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
 label?: React.ReactNode;
 description?: React.ReactNode;
 invalid?: boolean;
}
