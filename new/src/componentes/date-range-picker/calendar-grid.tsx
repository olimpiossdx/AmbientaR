import React from 'react';

import {
  getDaysInMonthGrid,
  isAfter,
  isBefore,
  isBetween,
  isSameDay,
  isWeekend,
  parseISODate,
  toDisplayDate,
} from '../../utils/date';
import type { ICalendarGridProps } from './propTypes.date-range-picker';
import { calendarGridStyles as styles } from './styles.date-range-picker';

function CalendarGridComponent({
  monthDate,
  start,
  end,
  hoverDate,
  minDate,
  maxDate,
  excludeWeekends,
  onDayClick,
  onHover,
}: ICalendarGridProps) {
  const days = React.useMemo(() => getDaysInMonthGrid(monthDate), [monthDate]);

  const min = React.useMemo(() => (minDate ? parseISODate(minDate) : null), [minDate]);
  const max = React.useMemo(() => (maxDate ? parseISODate(maxDate) : null), [maxDate]);

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (excludeWeekends && isWeekend(date)) {
        return true;
      }

      if (min && isBefore(date, min)) {
        return true;
      }

      if (max && isAfter(date, max)) {
        return true;
      }

      return false;
    },
    [excludeWeekends, max, min],
  );

  return (
    <div className={styles.root} onMouseLeave={() => onHover(null)}>
      <div className={styles.monthTitle}>
        {monthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>

      <div className={styles.weekHeader} aria-hidden="true">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayName, index) => (
          <span key={`${dayName}-${index}`} className={styles.weekDay}>
            {dayName}
          </span>
        ))}
      </div>

      <div className={styles.daysGrid} role="grid" aria-label={`Calendário de ${monthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`}>
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const disabledDay = isDateDisabled(day);
          const isSelStart = isSameDay(day, start);
          const isSelEnd = isSameDay(day, end);
          const isInRange = isBetween(day, start, end);
          const isHoverRange = Boolean(start && !end && hoverDate && isBetween(day, start, hoverDate));

          let stateClassName = styles.day.normal;
          let roundedClassName = styles.day.roundedFull;

          if (disabledDay) {
            stateClassName = styles.day.disabled;
          } else if (isSelStart || isSelEnd) {
            stateClassName = styles.day.selected;
          } else if (isInRange || isHoverRange) {
            stateClassName = styles.day.inRange;
            roundedClassName = styles.day.roundedNone;
          }

          if (isSelStart && (end || (hoverDate && isAfter(hoverDate, start)))) {
            roundedClassName = styles.day.roundedLeft;
          }

          if (isSelEnd || (start && !end && hoverDate && isSameDay(day, hoverDate))) {
            roundedClassName = styles.day.roundedRight;
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabledDay}
              aria-label={`Selecionar ${toDisplayDate(day)}`}
              aria-selected={isSelStart || isSelEnd}
              onClick={(event) => {
                event.stopPropagation();
                onDayClick(day);
              }}
              onMouseEnter={() => onHover(day)}
              role="gridcell"
              className={`${styles.day.base} ${stateClassName} ${roundedClassName}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const CalendarGrid = React.memo(CalendarGridComponent);
export default CalendarGrid;
