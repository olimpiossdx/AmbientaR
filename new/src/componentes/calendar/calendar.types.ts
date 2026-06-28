import type React from 'react';

export interface CalendarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  month?: Date;
  locale?: string;
  disabledDate?: (date: Date) => boolean;
}
