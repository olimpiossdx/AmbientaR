'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RCA } from '@/lib/types';
import {
  LISTAGEM_ACTIVITY_BY_CODE,
  LISTAGEM_CODES,
  LISTAGEM_SHORT_BY_CODE,
  extractListagemCode,
} from '@/lib/listagem-activities';
import { isRcaListagemImplemented } from '@/lib/rca/rca-termos-referencia-shared';
import { RcaFormListagemA } from './listagem-a/rca-form-listagem-a';
import { RcaFormListagemB } from './listagem-b/rca-form-listagem-b';
import { RcaFormListagemC } from './listagem-c/rca-form-listagem-c';
import { RcaFormListagemD } from './listagem-d/rca-form-listagem-d';
import { RcaFormListagemE } from './listagem-e/rca-form-listagem-e';
import { RcaFormListagemF } from './listagem-f/rca-form-listagem-f';
import { RcaFormListagemG } from './listagem-g/rca-form-listagem-g';
import { RcaFormListagemH } from './listagem-h/rca-form-listagem-h';
import { RcaFormLegacy } from './rca-form-legacy';

interface RcaFormProps {
  currentItem?: RCA | null;
  onSuccess: () => void;
  /** Força listagem na criação (ex.: A, B) — vindo de ?listagem=. */
  initialListagemCode?: string;
}

function resolveListagemCode(item?: RCA | null, initial?: string): string {
  if (initial?.trim()) return initial.trim().toUpperCase();
  const fromItem = (item as RCA & { listagemCode?: string })?.listagemCode;
  if (fromItem) return fromItem.toUpperCase();
  const fromActivity = extractListagemCode(item?.activity);
  if (fromActivity) return fromActivity;
  return '';
}

function RcaListagemPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="max-w-xl space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <Label>Listagem DN 217/17</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a listagem (A a H)" />
        </SelectTrigger>
        <SelectContent>
          {LISTAGEM_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              Listagem {code} — {LISTAGEM_SHORT_BY_CODE[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-xs text-muted-foreground">{LISTAGEM_ACTIVITY_BY_CODE[value]}</p>
      )}
    </div>
  );
}

function renderListagemForm(
  listagemCode: string,
  currentItem: RCA | null | undefined,
  onSuccess: () => void,
) {
  if (listagemCode === 'A') {
    return <RcaFormListagemA currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'B') {
    return <RcaFormListagemB currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'C') {
    return <RcaFormListagemC currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'D') {
    return <RcaFormListagemD currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'E') {
    return <RcaFormListagemE currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'F') {
    return <RcaFormListagemF currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'G') {
    return <RcaFormListagemG currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (listagemCode === 'H') {
    return <RcaFormListagemH currentItem={currentItem} onSuccess={onSuccess} />;
  }

  if (isRcaListagemImplemented(listagemCode)) {
    return null;
  }

  return (
    <RcaFormLegacy
      currentItem={currentItem}
      onSuccess={onSuccess}
      initialListagemCode={listagemCode}
    />
  );
}

export function RcaForm({ currentItem, onSuccess, initialListagemCode }: RcaFormProps) {
  const resolvedInitial = resolveListagemCode(currentItem, initialListagemCode);
  const [pickedListagem, setPickedListagem] = React.useState(resolvedInitial);

  React.useEffect(() => {
    if (resolvedInitial) setPickedListagem(resolvedInitial);
  }, [resolvedInitial]);

  const listagemCode = currentItem ? resolvedInitial : pickedListagem;

  if (!currentItem && !listagemCode) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Selecione a listagem</AlertTitle>
          <AlertDescription>
            O RCA está sendo reorganizado por listagem (padrão PCA). Listagens A a D já estão
            harmonizadas; as demais usam o formulário legado até a próxima fase.
          </AlertDescription>
        </Alert>
        <RcaListagemPicker value={pickedListagem} onChange={setPickedListagem} />
      </div>
    );
  }

  const form = renderListagemForm(listagemCode, currentItem, onSuccess);
  if (!form) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Listagem não implementada</AlertTitle>
        <AlertDescription>
          O formulário harmonizado para a Listagem {listagemCode} ainda não está disponível.
        </AlertDescription>
      </Alert>
    );
  }

  return form;
}
