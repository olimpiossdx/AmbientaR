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
import { PcaFormListagemBPrincipal } from './pca-form-listagem-b-principal';
import { PcaFormListagemBFerroligasComplemento } from './pca-form-listagem-b-ferroligas-complemento';
import { PcaFormListagemBFerroligasProcessos } from './pca-form-listagem-b-ferroligas-processos';
import { PcaFormListagemBFerroligasAmbiental } from './pca-form-listagem-b-ferroligas-ambiental';
import { PcaFormListagemBFerroligasImpactos } from './pca-form-listagem-b-ferroligas-impactos';
export function PcaFormListagemBFerroligas({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Produção de ligas ferrosas (ferro ligas)</strong> — Listagem B, código DN{' '}
        <strong>B-03-04-2</strong> (itens 23 a 59). O formulário geral permanece disponível no card acima.
      </div>
      <PcaFormListagemBPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <PcaFormListagemBFerroligasComplemento form={form} />
            <PcaFormListagemBFerroligasProcessos form={form} />
            <PcaFormListagemBFerroligasAmbiental form={form} />
            <PcaFormListagemBFerroligasImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
