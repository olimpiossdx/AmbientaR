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
import type { PCA } from '@/lib/types';
import {
  LISTAGEM_ACTIVITY_BY_CODE,
  LISTAGEM_CODES,
  LISTAGEM_SHORT_BY_CODE,
  extractListagemCode,
} from '@/lib/listagem-activities';
import { isPcaListagemImplemented } from '@/lib/pca/pca-termos-referencia-shared';
import { PcaFormListagemA } from './listagem-a/pca-form-listagem-a';
import { PcaFormListagemB } from './listagem-b/pca-form-listagem-b';
import { PcaFormListagemC } from './listagem-c/pca-form-listagem-c';
import { PcaFormListagemD } from './listagem-d/pca-form-listagem-d';
import { PcaFormListagemE } from './listagem-e/pca-form-listagem-e';
import { PcaFormListagemF } from './listagem-f/pca-form-listagem-f';
import { PcaFormListagemG } from './listagem-g/pca-form-listagem-g';
import { PcaFormListagemH } from './listagem-h/pca-form-listagem-h';
import { PcaFormLegacy } from './pca-form-legacy';

interface PcaFormProps {
  currentItem?: PCA | null;
  onSuccess?: () => void;
  /** Força listagem na criação (ex.: A, B, C) — vindo do submenu ou ?listagem=. */
  initialListagemCode?: string;
}

function resolveListagemCode(item?: PCA | null, initial?: string): string {
  if (initial?.trim()) return initial.trim().toUpperCase();
  const fromItem = (item as PCA & { listagemCode?: string })?.listagemCode;
  if (fromItem) return fromItem.toUpperCase();
  const fromActivity = extractListagemCode(item?.activity);
  if (fromActivity) return fromActivity;
  return '';
}

function PcaListagemPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4 max-w-xl">
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
  currentItem: PCA | null | undefined,
  onSuccess?: () => void,
) {
  if (listagemCode === 'A') {
    return <PcaFormListagemA currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'B') {
    return <PcaFormListagemB currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'C') {
    return <PcaFormListagemC currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'D') {
    return <PcaFormListagemD currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'E') {
    return <PcaFormListagemE currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'F') {
    return <PcaFormListagemF currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'G') {
    return <PcaFormListagemG currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (listagemCode === 'H') {
    return <PcaFormListagemH currentItem={currentItem} onSuccess={onSuccess} />;
  }
  if (currentItem && !isPcaListagemImplemented(listagemCode)) {
    return <PcaFormLegacy currentItem={currentItem} onSuccess={onSuccess} />;
  }
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Listagem {listagemCode} — formulário legado</AlertTitle>
        <AlertDescription>
          O PCA estruturado para a Listagem {listagemCode} será implementado em fase posterior
          (pasta <code>LISTAGEM {listagemCode}/</code>). Utilize o formulário genérico abaixo ou
          escolha Listagem A, B, C, D, E, F, G ou H.
        </AlertDescription>
      </Alert>
      <PcaFormLegacy
        currentItem={{
          ...(currentItem as PCA),
          activity: LISTAGEM_ACTIVITY_BY_CODE[listagemCode] ?? currentItem?.activity ?? '',
        }}
        onSuccess={onSuccess}
      />
    </div>
  );
}

export function PcaForm({ currentItem, onSuccess, initialListagemCode }: PcaFormProps) {
  const [listagemCode, setListagemCode] = React.useState(() =>
    resolveListagemCode(currentItem, initialListagemCode),
  );

  React.useEffect(() => {
    setListagemCode(resolveListagemCode(currentItem, initialListagemCode));
  }, [currentItem, initialListagemCode]);

  if (currentItem) {
    return renderListagemForm(listagemCode, currentItem, onSuccess);
  }

  return (
    <div className="space-y-4">
      <PcaListagemPicker value={listagemCode} onChange={setListagemCode} />
      {!listagemCode ? (
        <Alert>
          <AlertTitle>PCA — Listagens A a H disponíveis</AlertTitle>
          <AlertDescription>
            Escolha a listagem no seletor acima ou use o submenu PCA em Estudos Técnicos (Listagem
            A a H).
          </AlertDescription>
        </Alert>
      ) : (
        renderListagemForm(listagemCode, null, onSuccess)
      )}
    </div>
  );
}
