import type React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
 required?: boolean;
 optional?: boolean | React.ReactNode;
}
