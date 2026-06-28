import React from 'react';
import { cn } from '../../utils/cn';
import type { CalendarProps } from './calendar.types';
function sameDay(a?: Date, b?: Date) { return Boolean(a && b && a.toDateString() === b.toDateString()); }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function daysInMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }
export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(({ value, defaultValue, onValueChange, month, locale = 'pt-BR', disabledDate, className, ...props }, ref) => {
 const [internalValue, setInternalValue] = React.useState<Date | undefined>(defaultValue);
 const [visibleMonth, setVisibleMonth] = React.useState(startOfMonth(month ?? value ?? defaultValue ?? new Date()));
 const selected = value ?? internalValue;
 const firstWeekDay = startOfMonth(visibleMonth).getDay();
 const total = daysInMonth(visibleMonth);
 const days = Array.from({ length: firstWeekDay + total }, (_, i) => i < firstWeekDay ? null : new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), i - firstWeekDay + 1));
 const setSelected = (date: Date) => { if (value === undefined) setInternalValue(date); onValueChange?.(date); };
 return <div ref={ref} className={cn('w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-sm', className)} {...props}><div className="mb-3 flex items-center justify-between"><button type="button" className="rounded px-2 py-1 hover:bg-gray-100" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>‹</button><strong className="text-sm capitalize">{visibleMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</strong><button type="button" className="rounded px-2 py-1 hover:bg-gray-100" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>›</button></div><div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{days.map((date, i) => date ? <button key={i} type="button" disabled={disabledDate?.(date)} className={cn('h-8 rounded text-sm hover:bg-blue-50 disabled:opacity-40', sameDay(date, selected) && 'bg-blue-600 text-white hover:bg-blue-600')} onClick={() => setSelected(date)}>{date.getDate()}</button> : <span key={i} />)}</div></div>;
});
Calendar.displayName = 'Calendar';
