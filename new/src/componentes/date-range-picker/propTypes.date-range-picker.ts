import React from 'react';

import { addDays, getToday } from '../../utils/date';

export type DateRangePickerSize = 'sm' | 'md' | 'lg';

export interface DateRangePreset {
  label: string;
  getValue: () => [Date, Date];
}

export interface IDateRangePickerProps {
  /** Nome base do campo. Gera automaticamente `${name}-start` e `${name}-end`. */
  name: string;
  label?: React.ReactNode;

  minDate?: string;
  maxDate?: string;
  excludeWeekends?: boolean;

  months?: 1 | 2;
  showPresets?: boolean;
  matchInputWidth?: boolean;
  presets?: DateRangePreset[];

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  size?: DateRangePickerSize;
  className?: string;
}

export interface ICalendarGridProps {
  monthDate: Date;
  start: Date | null;
  end: Date | null;
  hoverDate: Date | null;
  minDate?: string;
  maxDate?: string;
  excludeWeekends?: boolean;
  onDayClick: (date: Date) => void;
  onHover: (date: Date | null) => void;
}

export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  { label: 'Hoje', getValue: () => [getToday(), getToday()] },
  {
    label: 'Ontem',
    getValue: () => [addDays(getToday(), -1), addDays(getToday(), -1)],
  },
  {
    label: 'Últimos 7 dias',
    getValue: () => [addDays(getToday(), -7), getToday()],
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => [addDays(getToday(), -30), getToday()],
  },
  {
    label: 'Este mês',
    getValue: () => {
      const now = getToday();
      return [
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      ];
    },
  },
];
