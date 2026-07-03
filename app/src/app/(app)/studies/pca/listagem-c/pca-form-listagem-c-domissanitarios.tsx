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
import { PcaFormListagemCSecao6Domissanitarios } from './pca-form-listagem-c-secao6-domissanitarios';
import { PcaFormListagemCDomissanitariosModulo4 } from './pca-form-listagem-c-domissanitarios-modulo4';
import { PcaFormListagemCTecnico } from './pca-form-listagem-c-tecnico';
import { PcaFormListagemCDomissanitariosImpactos } from './pca-form-listagem-c-domissanitarios-impactos';
export function PcaFormListagemCDomissanitarios({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústrias de produtos domissanitários, sabões, detergentes e preparados para limpeza e
        polimento</strong> (C-04-11-1, C-04-12-1, C-04-13-0), conforme TR RCA — itens 1 a 45.
      </div>
      <PcaFormListagemCPrincipal
        form={form}
        hideEspecifico
        hideLegislacaoMunicipal
        slotSecao6={<PcaFormListagemCSecao6Domissanitarios form={form} />}
        slotModulo4Complemento={<PcaFormListagemCDomissanitariosModulo4 form={form} />}
        slotEspecifico={
          <>
            <PcaFormListagemCTecnico form={form} variant="domissanitarios" />
            <PcaFormListagemCDomissanitariosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
