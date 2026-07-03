'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  INCONFORMIDADE_CRITICALITY_LEVELS,
  inconformidadeCriticalityDotClass,
  inconformidadeCriticalitySelectTriggerClass,
  normalizeInconformidadeCriticality,
  type InconformidadeCriticality,
} from '@/lib/status-display-classes';

type CriticalitySelectProps = {
  value?: InconformidadeCriticality | string;
  onChange: (value: InconformidadeCriticality) => void;
  triggerClassName?: string;
  placeholder?: string;
};

export function CriticalitySelect({
  value,
  onChange,
  triggerClassName,
  placeholder = 'Nível',
}: CriticalitySelectProps) {
  const resolved = normalizeInconformidadeCriticality(value);

  return (
    <Select
      value={resolved}
      onValueChange={(v) => onChange(normalizeInconformidadeCriticality(v))}
    >
      <SelectTrigger
        className={cn(
          'min-h-10 h-10 font-medium border',
          inconformidadeCriticalitySelectTriggerClass(resolved),
          triggerClassName,
        )}
      >
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full shrink-0',
              inconformidadeCriticalityDotClass(resolved),
            )}
            aria-hidden
          />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {INCONFORMIDADE_CRITICALITY_LEVELS.map((level) => (
          <SelectItem key={level} value={level}>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full shrink-0',
                  inconformidadeCriticalityDotClass(level),
                )}
                aria-hidden
              />
              {level}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
