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
import { TrechoCoordenadasBlock } from './pca-form-listagem-e-coordenadas';
export function PcaFormListagemEGeoTrecho({ form }: { form: any }) {
  return (
    <PcaSectionCard title="5. Localização geográfica (trecho)">
      <FormDescription>
        Informar coordenadas do início e do final do trecho (Lat/Long e/ou UTM). No layout da rede, incluir ponto a cada 10 km (Anexo II).
      </FormDescription>
      <TrechoCoordenadasBlock form={form} basePath="listagemE.geoTrecho.inicio" title="Início do trecho" />
      <TrechoCoordenadasBlock form={form} basePath="listagemE.geoTrecho.fim" title="Final do trecho" />
    </PcaSectionCard>
  );
}
