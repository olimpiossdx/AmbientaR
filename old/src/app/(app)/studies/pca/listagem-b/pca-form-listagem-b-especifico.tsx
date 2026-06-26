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
import { PcaFormListagemBProcessos } from './pca-form-listagem-b-processos';
import { PcaFormListagemBAmbiental } from './pca-form-listagem-b-ambiental';
interface PcaFormListagemBEspecificoProps {
  form: any;
}

export function PcaFormListagemBEspecifico({ form }: PcaFormListagemBEspecificoProps) {
  return (
    <div className="space-y-6">
      <PcaFormListagemBProcessos form={form} />
      <PcaFormListagemBAmbiental form={form} />
    </div>
  );
}
