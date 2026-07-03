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
import { PcaFormListagemBNaoFerrososProcessos } from './pca-form-listagem-b-nao-ferrosos-processos';
import { PcaFormListagemBAmbiental } from './pca-form-listagem-b-ambiental';
import { PcaFormListagemBFundidosImpactos } from './pca-form-listagem-b-fundidos-impactos';
export function PcaFormListagemBNaoFerrosos({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha específica para <strong>Produção de fundidos de metais não ferrosos</strong>, inclusive ligas, com e
        sem tratamento químico superficial e/ou galvanotécnico, inclusive a partir da reciclagem — Listagem B, TR DN
        74/2004 (itens 23 a 61). O formulário geral permanece disponível no card acima.
      </div>
      <PcaFormListagemBPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <PcaFormListagemBFundidosComplemento form={form} />
            <PcaFormListagemBNaoFerrososProcessos form={form} />
            <PcaFormListagemBAmbiental form={form} />
            <PcaFormListagemBFundidosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
