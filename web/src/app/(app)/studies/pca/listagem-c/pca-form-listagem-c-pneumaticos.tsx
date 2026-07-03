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
import { PcaFormListagemCPrincipal } from './pca-form-listagem-c-principal';
import { PcaFormListagemCTecnico } from './pca-form-listagem-c-tecnico';
import { PcaFormListagemCImpactos } from './pca-form-listagem-c-impactos';
export function PcaFormListagemCPneumaticos({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústria da borracha – pneumáticos</strong> (fabricação C-02-02-1 e recauchutagem C-02-03-8),
        conforme TR RCA para indústrias de pneumáticos — itens 1 a 44. O formulário geral permanece disponível no card
        acima.
      </div>
      <PcaFormListagemCPrincipal
        form={form}
        hideEspecifico
        slotEspecifico={
          <>
            <PcaFormListagemCTecnico form={form} />
            <PcaFormListagemCImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
