"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale/pt-BR";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  brDateToIso,
  dateValueToIso,
  formatDateBr,
  isoToDate,
  maskBrDateInput,
} from "@/lib/br-format";

type BrDateInputBaseProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "defaultValue"
> & {
  /** Exibe calendário ao clicar no ícone (padrão: true). */
  showCalendar?: boolean;
  className?: string;
};

export type BrDateInputProps = BrDateInputBaseProps & {
  /** Valor ISO `yyyy-MM-dd` ou vazio. */
  value: string;
  onChange: (iso: string) => void;
};

/** Campo de data BR (dd/mm/aaaa) com máscara e calendário; valor em ISO `yyyy-MM-dd`. */
export function BrDateInput({
  value,
  onChange,
  onBlur,
  showCalendar = true,
  className,
  disabled,
  ...props
}: BrDateInputProps) {
  const [display, setDisplay] = React.useState(() => formatDateBr(value));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDisplay(formatDateBr(value));
  }, [value]);

  const commitIso = React.useCallback(
    (masked: string) => {
      if (!masked) {
        onChange("");
        return;
      }
      if (masked.length === 10) {
        const iso = brDateToIso(masked);
        onChange(iso ?? "");
      }
    },
    [onChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskBrDateInput(e.target.value);
    setDisplay(masked);
    commitIso(masked);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (display.length > 0 && display.length < 10) {
      setDisplay("");
      onChange("");
    } else if (display.length === 10) {
      const iso = brDateToIso(display);
      if (!iso) {
        setDisplay("");
        onChange("");
      } else {
        setDisplay(formatDateBr(iso));
      }
    }
    onBlur?.(e);
  };

  const selectedDate = isoToDate(value);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) {
      setDisplay("");
      onChange("");
      return;
    }
    const iso = dateValueToIso(date);
    setDisplay(formatDateBr(iso));
    onChange(iso);
    setOpen(false);
  };

  const input = (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/AAAA"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={cn(showCalendar && "pr-9", className)}
      {...props}
    />
  );

  if (!showCalendar) {
    return input;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        {input}
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label="Abrir calendário"
            tabIndex={-1}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selectedDate}
          onSelect={handleCalendarSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export type BrDateFormControlProps = Omit<
  BrDateInputBaseProps,
  "name"
> & {
  value?: Date | string | null;
  onChange: (value: Date | string | undefined) => void;
  onBlur?: () => void;
  /** Quando true, `onChange` recebe `Date`; senão string ISO `yyyy-MM-dd`. */
  asDate?: boolean;
};

/** Integração com react-hook-form (`Date` ou ISO). */
export function BrDateFormControl({
  value,
  onChange,
  onBlur,
  asDate = false,
  ...props
}: BrDateFormControlProps) {
  const iso = dateValueToIso(value);

  return (
    <BrDateInput
      value={iso}
      onChange={(nextIso) => {
        if (asDate) {
          onChange(nextIso ? isoToDate(nextIso) : undefined);
        } else {
          onChange(nextIso);
        }
      }}
      onBlur={onBlur}
      {...props}
    />
  );
}
