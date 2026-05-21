"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { brDateToIso, isoDateToBr, maskBrDateInput } from "@/lib/br-format";

type BrDateInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onChange: (iso: string) => void;
};

export function BrDateInput({ value, onChange, onBlur, ...props }: BrDateInputProps) {
  const [display, setDisplay] = React.useState(() => isoDateToBr(value));

  React.useEffect(() => {
    setDisplay(isoDateToBr(value));
  }, [value]);

  const commitDisplay = (masked: string) => {
    if (!masked) {
      onChange("");
      return;
    }
    if (masked.length === 10) {
      const iso = brDateToIso(masked);
      onChange(iso ?? "");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskBrDateInput(e.target.value);
    setDisplay(masked);
    commitDisplay(masked);
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
      }
    }
    onBlur?.(e);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/AAAA"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
