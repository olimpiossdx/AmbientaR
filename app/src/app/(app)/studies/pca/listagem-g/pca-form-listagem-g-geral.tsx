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
import { PcaFormListagemGeralBase } from '../lib/pca-form-geral-base';
import {
  inferirFormularioPcaListagemG,
  PCA_LISTAGEM_G_ACTIVITY_BY_TIPO,
  PCA_LISTAGEM_G_FORM_TIPO_PADRAO,
} from './pca-listagem-g-registry';
export function PcaFormListagemGGeral({ form }: { form: any }) {
  return (
    <PcaFormListagemGeralBase
      form={form}
      letter="G"
      dataPrefix="listagemG"
      title="Listagem G – formulário geral"
      description="Para atividades agrossilvipastoris e demais da Listagem G sem anexo específico no sistema."
      inferirFormulario={inferirFormularioPcaListagemG}
      activityByTipo={PCA_LISTAGEM_G_ACTIVITY_BY_TIPO}
      defaultTipo={PCA_LISTAGEM_G_FORM_TIPO_PADRAO}
    />
  );
}
