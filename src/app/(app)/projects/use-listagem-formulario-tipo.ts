'use client';

import * as React from 'react';
import type { ListagemLetter } from './listagem-form-activity';
import { listagemFormFieldPath, resolveListagemActivity } from './listagem-form-activity';

export interface ListagemFormularioTipoConfig<T extends string = string> {
  letter: ListagemLetter;
  defaultTipo: T;
  activityByTipo: Record<string, string>;
}

export function useListagemFormularioTipo<T extends string>(
  form: {
    watch: (name: string) => unknown;
    getValues: (name: string) => unknown;
    setValue: (name: string, value: unknown, options?: { shouldDirty?: boolean }) => void;
  },
  config: ListagemFormularioTipoConfig<T>,
) {
  const fieldPath = listagemFormFieldPath(config.letter);
  const tipo = (form.watch(fieldPath) as T | undefined) || config.defaultTipo;

  React.useEffect(() => {
    if (!form.getValues(fieldPath)) {
      form.setValue(fieldPath, config.defaultTipo, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inicialização
  }, []);

  const syncActivity = React.useCallback(
    (nextTipo: string) => {
      form.setValue(
        'activity',
        resolveListagemActivity(config.letter, nextTipo, config.activityByTipo, config.defaultTipo),
        { shouldDirty: true },
      );
    },
    [config.activityByTipo, config.defaultTipo, config.letter, form],
  );

  React.useEffect(() => {
    syncActivity(tipo);
  }, [tipo, syncActivity]);

  const setFormularioTipo = React.useCallback(
    (nextTipo: T) => {
      form.setValue(fieldPath, nextTipo, { shouldDirty: true });
      syncActivity(nextTipo);
    },
    [fieldPath, form, syncActivity],
  );

  const inferirFormularioTipo = React.useCallback(
    (nextTipo: T) => {
      form.setValue(fieldPath, nextTipo, { shouldDirty: true });
      syncActivity(nextTipo);
    },
    [fieldPath, form, syncActivity],
  );

  return { tipo, fieldPath, setFormularioTipo, inferirFormularioTipo };
}
