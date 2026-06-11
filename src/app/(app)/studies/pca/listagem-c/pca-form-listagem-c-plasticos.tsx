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
import { PcaFormListagemCSecao6Plasticos } from './pca-form-listagem-c-secao6-plasticos';
import { PcaFormListagemCPlasticosModulo4 } from './pca-form-listagem-c-plasticos-modulo4';
import { PcaFormListagemCPlasticosTecnico } from './pca-form-listagem-c-plasticos-tecnico';
import { PcaFormListagemCPlasticosImpactos } from './pca-form-listagem-c-plasticos-impactos';
export function PcaFormListagemCPlasticos({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Ficha para <strong>Indústria de plásticos</strong> (moldagem C-07-* e reciclagem F-05-*), conforme TR RCA para
        indústria de plásticos — itens 1 a 57.
      </div>
      <PcaFormListagemCPrincipal
        form={form}
        hideEspecifico
        hideLegislacaoMunicipal
        slotSecao6={<PcaFormListagemCSecao6Plasticos form={form} />}
        slotModulo4Complemento={<PcaFormListagemCPlasticosModulo4 form={form} />}
        slotEspecifico={
          <>
            <PcaFormListagemCPlasticosTecnico form={form} />
            <PcaFormListagemCPlasticosImpactos form={form} />
          </>
        }
      />
    </div>
  );
}
