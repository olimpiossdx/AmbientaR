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
import { PcaFormListagemBFundidosComplemento } from './pca-form-listagem-b-fundidos-complemento';
import { PcaFormListagemBProcessos } from './pca-form-listagem-b-processos';
import { PcaFormListagemBAmbiental } from './pca-form-listagem-b-ambiental';
import { PcaFormListagemBFundidosImpactos } from './pca-form-listagem-b-fundidos-impactos';
export function PcaFormListagemBFundidosFerroAco({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Produção de fundidos de ferro e aço</strong>, com e sem tratamento químico
        superficial, inclusive a partir da reciclagem — Listagem B, TR DN 74/2004 (itens 23 a 62). O formulário geral
        permanece disponível no card acima.
      </div>
      <PcaFormListagemBPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <PcaFormListagemBFundidosComplemento form={form} />
            <PcaFormListagemBProcessos form={form} />
            <PcaFormListagemBAmbiental form={form} />
            <PcaFormListagemBFundidosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
