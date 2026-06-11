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
import { PcaFormListagemCSecao6Papel } from './pca-form-listagem-c-secao6-papel';
import { PcaFormListagemCPapelModulo4 } from './pca-form-listagem-c-papel-modulo4';
import { PcaFormListagemCTecnico } from './pca-form-listagem-c-tecnico';
import { PcaFormListagemCPapelImpactos } from './pca-form-listagem-c-papel-impactos';
export function PcaFormListagemCPapel({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústrias de papel e papelão</strong> (celulose C-01-01-5, pasta mecânica C-01-02-3, papel
        C-01-03-1), conforme TR RCA — itens 1 a 47.
      </div>
      <PcaFormListagemCPrincipal
        form={form}
        hideEspecifico
        hideLegislacaoMunicipal
        slotSecao6={<PcaFormListagemCSecao6Papel form={form} />}
        slotModulo4Complemento={<PcaFormListagemCPapelModulo4 form={form} />}
        slotEspecifico={
          <>
            <PcaFormListagemCTecnico form={form} variant="papel" />
            <PcaFormListagemCPapelImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
