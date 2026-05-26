'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LISTAGEM_ACTIVITY_BY_CODE,
  LISTAGEM_CODES,
  LISTAGEM_SHORT_BY_CODE,
  extractListagemCode,
  getListagemDisplayLabel,
} from '@/lib/listagem-activities';

type ListagemActivityPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** RCA usa rótulos longos do catálogo; PCA/EIA usam listagem A–H padrão. */
  options?: string[];
  disabled?: boolean;
};

export function ListagemActivityPicker({
  value,
  onValueChange,
  options,
  disabled,
}: ListagemActivityPickerProps) {
  const items =
    options ??
    LISTAGEM_CODES.map((code) => LISTAGEM_ACTIVITY_BY_CODE[code]);

  const selectedCode = extractListagemCode(value) ?? '';

  return (
    <div className="space-y-2">
      <Label>Listagem / atividade (DN 217)</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-auto min-h-10">
          <SelectValue placeholder="Selecione a listagem (A a H)" />
        </SelectTrigger>
        <SelectContent className="max-h-[min(24rem,70vh)]">
          {items.map((opt) => {
            const code = extractListagemCode(opt) ?? '';
            const short = code ? LISTAGEM_SHORT_BY_CODE[code] : null;
            return (
              <SelectItem key={opt} value={opt} className="py-2">
                <span className="flex flex-col gap-0.5 text-left">
                  <span className="flex items-center gap-2">
                    {code ? (
                      <Badge variant="outline" className="shrink-0 font-mono">
                        {code}
                      </Badge>
                    ) : null}
                    <span className="font-medium">{short ?? 'Atividade'}</span>
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{opt}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selectedCode && (
        <p className="text-xs text-muted-foreground">
          Selecionado: {getListagemDisplayLabel(selectedCode)}
        </p>
      )}
    </div>
  );
}
