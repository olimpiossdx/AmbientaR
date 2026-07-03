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
const biomas = ['Cerrado', 'Mata Atlântica', 'Outro'] as const;

const formacoesVegetais = [
  'Floresta Ombrófila Sub Montana',
  'Floresta Ombrófila Montana',
  'Floresta Estacional Semidecidual Sub Montana',
  'Campo',
  'Campo Rupestre',
  'Cerrado',
  'Cerradão',
  'Vereda',
  'Outro',
];

export function PcaFormListagemFModulo3({ form }: { form: any }) {
  const emApp = form.watch('locationalRestrictions.inApp');
  const propApp = form.watch('locationalRestrictions.propertyHasApp');

  return (
    <div className="space-y-6">
      <PcaSectionCard title="Módulo 3 – Restrições ambientais">
        <p className="text-sm text-muted-foreground">Itens 11 e 12 do RCA – posto de combustível.</p>
      </PcaSectionCard>

      <PcaSectionCard title="11. Restrições locacionais">
        <FormField
          control={form.control}
          name="locationalRestrictions.biome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qual bioma o empreendimento está localizado?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                {biomas.map((bioma) => (
                  <FormItem key={bioma} className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value={bioma} />
                    </FormControl>
                    <FormLabel className="font-normal">{bioma}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <PcaTextField form={form} name="listagemF.restricoesLocacionais.biomaOutro" label="Outro bioma (qual?)" />
        <FormField
          control={form.control}
          name="listagemF.restricoesLocacionais.remanescenteVegetacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remanescente de formações vegetais nativas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemF.restricoesLocacionais.remanescenteVegetacao') && (
          <PcaCheckboxOptions
            form={form}
            name="listagemF.restricoesLocacionais.tipologias"
            options={formacoesVegetais.map((f) => ({ id: f, label: f }))}
          />
        )}
        <FormField
          control={form.control}
          name="locationalRestrictions.inApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento está localizado em APP?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.propertyHasApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A propriedade possui APP?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {(emApp || propApp) && (
          <>
            <FormField
              control={form.control}
              name="locationalRestrictions.appPreserved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>A APP se encontra comprovadamente preservada?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationalRestrictions.appProtected"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>A APP está protegida?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="locationalRestrictions.inKarstArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localiza-se em área cárstica?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.inFluvialLacustrineArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localiza-se em área fluvial/lacustre?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="12. Unidades de conservação">
        <FormField
          control={form.control}
          name="conservationUnit.isInConservationUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Está em UC, zona de amortecimento ou raio de 10 km?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value="Não" />
                  </FormControl>
                  <FormLabel className="font-normal">Não, passar para o Módulo 4</FormLabel>
                </FormItem>
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value="Sim" />
                  </FormControl>
                  <FormLabel className="font-normal">Sim</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="conservationUnit.distance" label="Distância" />
          <PcaTextField form={form} name="conservationUnit.ucName" label="Nome da UC" />
          <PcaTextField form={form} name="conservationUnit.jurisdiction" label="Jurisdição" />
        </div>
        <PcaCheckboxOptions
          form={form}
          name="listagemF.conservationUnit.categoriaManejo"
          options={[
            { id: 'uso_sustentavel', label: 'Uso sustentável' },
            { id: 'protecao_integral', label: 'Proteção integral' },
          ]}
        />
        <PcaTextField form={form} name="conservationUnit.managingBody" label="Órgão gestor" />
      </PcaSectionCard>
    </div>
  );
}
