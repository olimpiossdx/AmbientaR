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
import { PcaFormListagemFModulo3 } from './pca-form-listagem-f-modulo3';
import { PcaFormListagemFModulo4 } from './pca-form-listagem-f-modulo4';
import { PcaFormListagemFModulo5 } from './pca-form-listagem-f-modulo5';
import { PcaFormListagemFModulo6 } from './pca-form-listagem-f-modulo6';
export function PcaFormListagemFEspecifico({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <PcaFormListagemFModulo3 form={form} />
      <PcaFormListagemFModulo4 form={form} />
      <PcaFormListagemFModulo5 form={form} />
      <PcaFormListagemFModulo6 form={form} />
    </div>
  );
}
