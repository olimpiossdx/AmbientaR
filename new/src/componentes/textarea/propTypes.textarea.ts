import type React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
 label?: React.ReactNode;
 invalid?: boolean;
 fullWidth?: boolean;
 autoResize?: boolean;
 containerClassName?: string;
}
