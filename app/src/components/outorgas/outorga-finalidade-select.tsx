"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFinalidadeTabela03Label,
  OUTORGA_TABELA03_FINALIDADES,
  resolveFinalidadeTabela03Value,
} from "@/lib/outorga-mg-catalog";

type Props = {
  value?: string;
  onValueChange: (label: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

/** Finalidade do uso — Tabela 03 IGAM (lista rolável). */
export function OutorgaFinalidadeSelect({
  value,
  onValueChange,
  placeholder = "Selecione a finalidade (Tabela 03 IGAM)",
  disabled,
  id,
}: Props) {
  const selectValue = resolveFinalidadeTabela03Value(value);

  return (
    <Select
      value={selectValue || undefined}
      onValueChange={(id) => onValueChange(getFinalidadeTabela03Label(id))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[min(60vh,280px)]">
        {OUTORGA_TABELA03_FINALIDADES.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
