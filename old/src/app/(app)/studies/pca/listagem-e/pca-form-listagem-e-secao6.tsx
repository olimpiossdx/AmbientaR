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
  inferirFormularioPcaListagemE,
  PCA_LISTAGEM_E_ACTIVITY_BY_TIPO,
  PCA_LISTAGEM_E_FORM_TIPO_PADRAO,
} from './pca-listagem-e-registry';
const atividadesPrincipais = [
  {
    id: 'gasNatural',
    label: 'Dutos para o transporte de gás natural',
    codigo: 'E-01-10-4',
    unidade: 'Extensão (km)',
  },
  {
    id: 'gasoduto',
    label: 'Gasodutos (exclusivo transporte de gás natural)',
    codigo: 'E-01-11-2',
    unidade: 'Extensão (km)',
  },
  {
    id: 'oleoduto',
    label: 'Dutos para transporte de produtos químicos e oleodutos',
    codigo: 'E-01-12-0',
    unidade: 'Extensão (km)',
  },
  {
    id: 'mineroduto',
    label: 'Minerodutos',
    codigo: 'E-01-13-9',
    unidade: 'Extensão (km)',
  },
] as const;

export function PcaFormListagemESecao6({ form }: { form: any }) {
  return (
    <PcaSectionCard title="6. Atividades do empreendimento conforme DN 217/17">
      {atividadesPrincipais.map((at) => (
        <div key={at.id} className="mb-4 rounded-md border p-3">
          <FormField
            control={form.control}
            name={`listagemE.atividadePrincipal.${at.id}.ativa`}
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
                  <FormLabel className="font-normal leading-snug">{at.label}</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Código {at.codigo} · Unidade: {at.unidade}
                  </p>
                </div>
              </FormItem>
            )}
          />
          {form.watch(`listagemE.atividadePrincipal.${at.id}.ativa`) && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <PcaTextField
                form={form}
                name={`listagemE.atividadePrincipal.${at.id}.quantidade`}
                label="Quantidade (km)"
              />
              <PcaTextField
                form={form}
                name={`listagemE.atividadePrincipal.${at.id}.inicioAtividade`}
                label="Início da atividade"
              />
            </div>
          )}
        </div>
      ))}
    </PcaSectionCard>
  );
}
