'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CaracterizacaoEfluenteAntesDepois,
  DetalhesControleEmissoes,
  DisposicaoTemporariaResiduo,
  PcaCheckboxOptions,
  PcaNumField,
  PcaSectionCard,
  PcaSituacaoRegularizacao,
  PcaTabelaLinhasFixas,
  PcaTextField,
  PcaTextAreaField,
} from '../lib/pca-form-helpers';
import { PcaMedidasSection } from '../lib/pca-medidas-section';
import {
  inferirFormularioPcaListagemD,
  PCA_LISTAGEM_D_ACTIVITY_BY_TIPO,
  PCA_LISTAGEM_D_CODIGO_AGUARDENTE,
  PCA_LISTAGEM_D_FORM_TIPO_PADRAO,
} from './pca-listagem-d-registry';
export function PcaFormListagemDSecao6({ form }: { form: any }) {
  return (
    <PcaSectionCard title="6. Atividades do empreendimento conforme DN 217/17">
      <div className="rounded-md border p-3">
        <FormField
          control={form.control}
          name="listagemD.atividadePrincipal.aguardente.ativa"
          render={({ field }) => (
            <FormItem className="flex items-start gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={Boolean(field.value)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    field.onChange(checked);
                    if (checked) {
                      }
                  }}
                />
              </FormControl>
              <div>
                <FormLabel className="font-normal leading-snug">
                  Fabricação de aguardente
                </FormLabel>
                <p className="text-xs text-muted-foreground">Código DN-217/17: D-02-02-1 · Unidade: litros de produto/dia</p>
              </div>
            </FormItem>
          )}
        />
        {form.watch('listagemD.atividadePrincipal.aguardente.ativa') && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <PcaTextField form={form} name="listagemD.atividadePrincipal.aguardente.quantidade" label="Quantidade (L/dia)" />
            <PcaTextField form={form} name="listagemD.atividadePrincipal.aguardente.inicioAtividade" label="Início da atividade" />
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Preencher o Termo de Referência da atividade principal. Demais atividades no item 12 (Módulo 4).
      </p>
    </PcaSectionCard>
  );
}
