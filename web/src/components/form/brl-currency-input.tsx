"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyBRLInput } from "@/lib/br-format";

type BrlCurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: number;
  onChange: (value: number) => void;
};

export function BrlCurrencyInput({ value, onChange, onBlur, ...props }: BrlCurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() =>
    value > 0 ? formatCurrencyBRLInput(value) : "",
  );

  React.useEffect(() => {
    setDisplayValue(value > 0 ? formatCurrencyBRLInput(value) : "");
  }, [value]);

  const applyDigits = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const numericValue = digits ? Number(digits) / 100 : 0;
    onChange(numericValue);
    setDisplayValue(numericValue > 0 ? formatCurrencyBRLInput(numericValue) : "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyDigits(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    applyDigits(e.target.value);
    onBlur?.(e);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="R$ 0,00"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="tabular-nums"
      {...props}
    />
  );
}
