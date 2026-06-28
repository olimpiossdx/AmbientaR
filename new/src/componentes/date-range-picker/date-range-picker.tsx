import React from 'react';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { Popover } from '../popover';
import {
  addMonths,
  isAfter,
  isBefore,
  isWeekend,
  maskDateInput,
  parseISODate,
  smartParseDate,
  toDisplayDate,
  toISODate,
  getToday,
} from '../../utils/date';
import CalendarGrid from './calendar-grid';
import type { DateRangePreset, IDateRangePickerProps } from './propTypes.date-range-picker';
import { DEFAULT_DATE_RANGE_PRESETS } from './propTypes.date-range-picker';
import { dateRangePickerStyles as styles } from './styles.date-range-picker';

function dispatchFormFieldEvents(input: HTMLInputElement): void {
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function isSameNullableDate(left: Date | null, right: Date | null): boolean {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return toISODate(left) === toISODate(right);
}

export const DateRangePicker: React.FC<IDateRangePickerProps> = ({
  name,
  label,
  required,
  disabled,
  readOnly,
  excludeWeekends,
  minDate,
  maxDate,
  showPresets = true,
  months = 1,
  matchInputWidth = false,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  className = '',
  size = 'md',
}) => {
  const reactId = React.useId();
  const rootId = `${name}-${reactId}`;
  const labelId = `${rootId}-label`;
  const panelId = `${rootId}-panel`;
  const startDateName = `${name}-start`;
  const endDateName = `${name}-end`;
  const effectiveDisabled = Boolean(disabled || readOnly);

  const [isOpen, setIsOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(getToday());
  const [start, setStart] = React.useState<Date | null>(null);
  const [end, setEnd] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const [startText, setStartText] = React.useState('');
  const [endText, setEndText] = React.useState('');

  const containerRef = React.useRef<HTMLDivElement>(null);
  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);
  const visualStartRef = React.useRef<HTMLInputElement>(null);
  const visualEndRef = React.useRef<HTMLInputElement>(null);

  const min = React.useMemo(() => (minDate ? parseISODate(minDate) : null), [minDate]);
  const max = React.useMemo(() => (maxDate ? parseISODate(maxDate) : null), [maxDate]);

  const isDateAllowed = React.useCallback(
    (date: Date) => {
      if (excludeWeekends && isWeekend(date)) {
        return false;
      }

      if (min && isBefore(date, min)) {
        return false;
      }

      if (max && isAfter(date, max)) {
        return false;
      }

      return true;
    },
    [excludeWeekends, max, min],
  );

  const isRangeAllowed = React.useCallback(
    (rangeStart: Date, rangeEnd: Date) => {
      return isDateAllowed(rangeStart) && isDateAllowed(rangeEnd) && !isBefore(rangeEnd, rangeStart);
    },
    [isDateAllowed],
  );

  const updateNativeValidity = React.useCallback(
    (nextStart: Date | null = start, nextEnd: Date | null = end) => {
      const startInput = startInputRef.current;
      const endInput = endInputRef.current;

      if (!startInput || !endInput) {
        return;
      }

      startInput.setCustomValidity('');
      endInput.setCustomValidity('');

      if (!required) {
        return;
      }

      if (!nextStart && !nextEnd) {
        startInput.setCustomValidity('Informe a data inicial.');
        return;
      }

      if (!nextStart) {
        startInput.setCustomValidity('Informe a data inicial.');
        return;
      }

      if (!nextEnd) {
        endInput.setCustomValidity('Informe a data final.');
        return;
      }

      if (isBefore(nextEnd, nextStart)) {
        endInput.setCustomValidity('A data final deve ser maior ou igual à inicial.');
      }
    },
    [end, required, start],
  );

  const syncStateFromNativeInputs = React.useCallback(() => {
    const nextStart = parseISODate(startInputRef.current?.value ?? '');
    const nextEnd = parseISODate(endInputRef.current?.value ?? '');

    setStart((current) => (isSameNullableDate(current, nextStart) ? current : nextStart));
    setEnd((current) => (isSameNullableDate(current, nextEnd) ? current : nextEnd));
    updateNativeValidity(nextStart, nextEnd);
  }, [updateNativeValidity]);

  const setNativeDateInputValue = React.useCallback((input: HTMLInputElement | null, value: string) => {
    if (!input || input.value === value) {
      return;
    }

    input.value = value;
    input.defaultValue = value;
    dispatchFormFieldEvents(input);
  }, []);

  const applyRange = React.useCallback(
    (newStart: Date | null, newEnd: Date | null) => {
      setStart(newStart);
      setEnd(newEnd);

      const startIso = toISODate(newStart);
      const endIso = toISODate(newEnd);

      setNativeDateInputValue(startInputRef.current, startIso);
      setNativeDateInputValue(endInputRef.current, endIso);

      if (endInputRef.current) {
        endInputRef.current.min = startIso || minDate || '';
      }

      updateNativeValidity(newStart, newEnd);
    },
    [minDate, setNativeDateInputValue, updateNativeValidity],
  );

  React.useEffect(() => {
    if (document.activeElement !== visualStartRef.current) {
      setStartText(toDisplayDate(start));
    }

    if (document.activeElement !== visualEndRef.current) {
      setEndText(toDisplayDate(end));
    }
  }, [end, start]);

  React.useEffect(() => {
    syncStateFromNativeInputs();

    const startInput = startInputRef.current;
    const endInput = endInputRef.current;
    const form = startInput?.closest('form') ?? endInput?.closest('form') ?? null;

    const handleReset = () => {
      requestAnimationFrame(syncStateFromNativeInputs);
    };

    const handleInvalid = (event: Event) => {
      if (event.target === startInput) {
        visualStartRef.current?.focus();
        setIsOpen(true);
        return;
      }

      if (event.target === endInput) {
        visualEndRef.current?.focus();
        setIsOpen(true);
      }
    };

    startInput?.addEventListener('input', syncStateFromNativeInputs);
    startInput?.addEventListener('change', syncStateFromNativeInputs);
    startInput?.addEventListener('useform:field-sync', syncStateFromNativeInputs);
    startInput?.addEventListener('invalid', handleInvalid);

    endInput?.addEventListener('input', syncStateFromNativeInputs);
    endInput?.addEventListener('change', syncStateFromNativeInputs);
    endInput?.addEventListener('useform:field-sync', syncStateFromNativeInputs);
    endInput?.addEventListener('invalid', handleInvalid);

    form?.addEventListener('reset', handleReset);

    return () => {
      startInput?.removeEventListener('input', syncStateFromNativeInputs);
      startInput?.removeEventListener('change', syncStateFromNativeInputs);
      startInput?.removeEventListener('useform:field-sync', syncStateFromNativeInputs);
      startInput?.removeEventListener('invalid', handleInvalid);

      endInput?.removeEventListener('input', syncStateFromNativeInputs);
      endInput?.removeEventListener('change', syncStateFromNativeInputs);
      endInput?.removeEventListener('useform:field-sync', syncStateFromNativeInputs);
      endInput?.removeEventListener('invalid', handleInvalid);

      form?.removeEventListener('reset', handleReset);
    };
  }, [syncStateFromNativeInputs]);

  React.useEffect(() => {
    updateNativeValidity(start, end);
  }, [end, start, updateNativeValidity]);

  const handleVisualChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>, isStart: boolean) => {
    const masked = maskDateInput(event.target.value);

    if (isStart) {
      setStartText(masked);
      return;
    }

    setEndText(masked);
  }, []);

  const handleVisualBlur = React.useCallback(
    (isStart: boolean) => {
      const ref = isStart ? visualStartRef : visualEndRef;
      const text = ref.current?.value ?? '';
      const date = smartParseDate(text);

      if (!date) {
        if (text.trim() === '') {
          if (isStart) {
            applyRange(null, end);
          } else {
            applyRange(start, null);
          }
          return;
        }

        if (isStart) {
          setStartText(toDisplayDate(start));
        } else {
          setEndText(toDisplayDate(end));
        }
        return;
      }

      if (!isDateAllowed(date)) {
        if (isStart) {
          setStartText(toDisplayDate(start));
        } else {
          setEndText(toDisplayDate(end));
        }
        return;
      }

      if (isStart) {
        applyRange(date, end && isBefore(end, date) ? null : end);
        setViewDate(date);
        return;
      }

      if (start && isBefore(date, start)) {
        setEndText(toDisplayDate(end));
        return;
      }

      applyRange(start, date);
    },
    [applyRange, end, isDateAllowed, start],
  );

  const handleVisualKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, isStart: boolean) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleVisualBlur(isStart);

        if (isStart) {
          visualEndRef.current?.focus();
          setIsOpen(true);
          return;
        }

        setIsOpen(false);
      }

      if (event.key === 'Tab' && !event.shiftKey && !isStart) {
        setIsOpen(false);
      }
    },
    [handleVisualBlur],
  );

  const handleDayClick = React.useCallback(
    (date: Date) => {
      if (!isDateAllowed(date)) {
        return;
      }

      if (!start || (start && end)) {
        applyRange(date, null);
        return;
      }

      if (isBefore(date, start)) {
        applyRange(date, start);
        return;
      }

      applyRange(start, date);
      setIsOpen(false);
    },
    [applyRange, end, isDateAllowed, start],
  );

  const handleHoverDate = React.useCallback((date: Date | null) => {
    setHoverDate((current) => (isSameNullableDate(current, date) ? current : date));
  }, []);

  const handlePresetClick = React.useCallback(
    (preset: DateRangePreset) => {
      const [presetStart, presetEnd] = preset.getValue();

      if (!isRangeAllowed(presetStart, presetEnd)) {
        return;
      }

      applyRange(presetStart, presetEnd);
      setViewDate(presetStart);
      setIsOpen(false);
    },
    [applyRange, isRangeAllowed],
  );

  const openCalendar = React.useCallback(() => {
    if (!effectiveDisabled) {
      setIsOpen(true);
    }
  }, [effectiveDisabled]);

  const toggleCalendar = React.useCallback(() => {
    if (!effectiveDisabled) {
      setIsOpen((current) => !current);
    }
  }, [effectiveDisabled]);

  const startInputMax = end ? toISODate(end) : maxDate;
  const endInputMin = toISODate(start) || minDate;

  return (
    <div className={`${styles.root} ${className}`}>
      {label && (
        <span id={labelId} className={`${styles.label.base} ${styles.label.size[size]}`}>
          {label} {required && <span className={styles.label.required}>*</span>}
        </span>
      )}

      <div
        ref={containerRef}
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className={`${styles.control.base} ${styles.control.size[size]} ${effectiveDisabled ? styles.control.disabled : ''}`}
        onClick={openCalendar}
      >
        <input
          ref={visualStartRef}
          value={startText}
          onChange={(event) => handleVisualChange(event, true)}
          onBlur={() => handleVisualBlur(true)}
          onKeyDown={(event) => handleVisualKeyDown(event, true)}
          onFocus={openCalendar}
          placeholder="Início"
          className={`${styles.input.base} ${styles.input.size[size]}`}
          readOnly={readOnly}
          disabled={disabled}
          aria-label={label ? undefined : "Data inicial"}
          aria-labelledby={label ? `${labelId} ${rootId}-start-label` : undefined}
          aria-expanded={isOpen}
          aria-controls={panelId}
        />

        <span id={`${rootId}-start-label`} className="sr-only">Data inicial</span>

        <span className={styles.separator} aria-hidden="true">
          <ArrowRight size={styles.arrowSize[size]} />
        </span>

        <input
          ref={visualEndRef}
          value={endText}
          onChange={(event) => handleVisualChange(event, false)}
          onBlur={() => handleVisualBlur(false)}
          onKeyDown={(event) => handleVisualKeyDown(event, false)}
          onFocus={openCalendar}
          placeholder="Fim"
          className={`${styles.input.base} ${styles.input.size[size]}`}
          readOnly={readOnly}
          disabled={disabled}
          aria-label={label ? undefined : "Data final"}
          aria-labelledby={label ? `${labelId} ${rootId}-end-label` : undefined}
          aria-expanded={isOpen}
          aria-controls={panelId}
        />

        <span id={`${rootId}-end-label`} className="sr-only">Data final</span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleCalendar();
          }}
          className={`${styles.calendarButton.base} ${styles.calendarButton.size[size]}`}
          disabled={effectiveDisabled}
          aria-label={isOpen ? "Fechar calendário" : "Abrir calendário"}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <Calendar size={styles.iconSize[size]} />
        </button>
      </div>

      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
        triggerRef={containerRef}
        portal
        fullWidth={matchInputWidth}
        align="start"
        sideOffset={4}
        className={styles.panel}
        id={panelId}
        aria-label={label ? `Calendário de ${label}` : 'Calendário'}
      >
        {showPresets && (
          <div className={styles.presets.list}>
            {presets.map((preset) => {
              const [presetStart, presetEnd] = preset.getValue();
              const disabledPreset = !isRangeAllowed(presetStart, presetEnd);

              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={disabledPreset}
                  onClick={() => handlePresetClick(preset)}
                  className={styles.presets.item}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex w-full flex-col">
          <div className={styles.navigation.container}>
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, -1))}
              className={styles.navigation.button}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div className={styles.navigation.title}>Seleção</div>

            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, 1))}
              className={styles.navigation.button}
              aria-label="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className={styles.calendars}>
            <div className={styles.calendarWrapper}>
              <CalendarGrid
                monthDate={viewDate}
                start={start}
                end={end}
                hoverDate={hoverDate}
                minDate={minDate}
                maxDate={maxDate}
                excludeWeekends={excludeWeekends}
                onDayClick={handleDayClick}
                onHover={handleHoverDate}
              />
            </div>

            {months === 2 && (
              <div className={`${styles.calendarWrapper} ${styles.calendarDivider}`}>
                <CalendarGrid
                  monthDate={addMonths(viewDate, 1)}
                  start={start}
                  end={end}
                  hoverDate={hoverDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  excludeWeekends={excludeWeekends}
                  onDayClick={handleDayClick}
                  onHover={handleHoverDate}
                />
              </div>
            )}
          </div>
        </div>
      </Popover>

      <input
        ref={startInputRef}
        type="date"
        name={startDateName}
        required={required}
        min={minDate}
        max={startInputMax}
        disabled={disabled}
        readOnly={readOnly}
        className={styles.nativeInput}
        tabIndex={-1}
        aria-hidden="true"
      />

      <input
        ref={endInputRef}
        type="date"
        name={endDateName}
        required={required}
        min={endInputMin}
        max={maxDate}
        disabled={disabled}
        readOnly={readOnly}
        className={styles.nativeInput}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

export default DateRangePicker;
