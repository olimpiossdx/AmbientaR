'use client';

import type { ListagemLetter } from '@/app/(app)/projects/listagem-form-activity';
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
} from './pca-form-helpers';
import { PcaMedidasSection } from './pca-medidas-section';
interface FormListagemGeralBaseProps {
  form: any;
  letter: ListagemLetter;
  /** Ex.: listagemG */
  dataPrefix: string;
  title: string;
  description: string;
  /** Inferência DN → formularioTipo (pode sobrescrever) ao preencher código na tabela */
  inferirFormulario?: (codigoDn?: string | null) => string;
  activityByTipo?: Record<string, string>;
  defaultTipo?: string;
}

/**
 * Formulário geral reutilizável por listagem (dados em listagemX.geral.*).
 */
export function PcaFormListagemGeralBase({
  form,
  letter,
  dataPrefix,
  title,
  description,
  inferirFormulario,
  activityByTipo,
  defaultTipo,
}: FormListagemGeralBaseProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `${dataPrefix}.geral.atividades`,
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title={title}>
        <FormDescription>
          {description} Dados em <code className="text-xs">{dataPrefix}.geral</code>, separados das fichas
          específicas da Listagem {letter}.
        </FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="Identificação resumida do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaTextField form={form} name={`${dataPrefix}.geral.empreendimento.nome`} label="Nome / razão social" />
          <PcaTextField form={form} name={`${dataPrefix}.geral.empreendimento.cnpj`} label="CNPJ / CPF" />
          <PcaTextField form={form} name={`${dataPrefix}.geral.empreendimento.municipio`} label="Município" />
          <PcaTextField form={form} name={`${dataPrefix}.geral.empreendimento.uf`} label="UF" />
          <PcaTextField
            form={form}
            name={`${dataPrefix}.geral.empreendimento.localizacao`}
            label="Localização / endereço"
            className="md:col-span-2"
          />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="Atividades (DN 217/17)">
        {fields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <PcaTextField form={form} name={`${dataPrefix}.geral.atividades.${index}.descricao`} label="Atividade" />
            <PcaTextField
              form={form}
              name={`${dataPrefix}.geral.atividades.${index}.codigo`}
              label="Código DN"
            />
            <PcaTextField form={form} name={`${dataPrefix}.geral.atividades.${index}.unidade`} label="Unidade" />
            <PcaTextField form={form} name={`${dataPrefix}.geral.atividades.${index}.quantidade`} label="Quantidade" />
            <PcaTextField form={form} name={`${dataPrefix}.geral.atividades.${index}.inicio`} label="Início" />
            <div className="flex justify-end md:col-span-5">
              <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ descricao: '', codigo: '', unidade: '', quantidade: '', inicio: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar atividade
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="Licenciamento">
        <FormField
          control={form.control}
          name={`${dataPrefix}.geral.licenciamento.fase`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fase</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {['LP', 'LI', 'LIC', 'LP+LI', 'LO', 'LOC'].map((fase) => (
                  <FormItem key={fase} className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value={fase} />
                    </FormControl>
                    <FormLabel className="font-normal">{fase}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <PcaTextField form={form} name={`${dataPrefix}.geral.licenciamento.classe`} label="Classe" />
        <FormField
          control={form.control}
          name={`${dataPrefix}.geral.licenciamento.ampliacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ampliação/modificação de empreendimento licenciado?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <PcaTextField form={form} name={`${dataPrefix}.geral.licenciamento.processo`} label="Nº processo (se aplicável)" />
      </PcaSectionCard>

      <PcaSectionCard title="Informações complementares">
        <FormField
          control={form.control}
          name={`${dataPrefix}.geral.observacoes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição técnica e referência a anexos</FormLabel>
              <FormControl>
                <Textarea rows={6} placeholder="Descrever o empreendimento, intervenções e anexos do processo..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${dataPrefix}.geral.passivosAmbientais`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passivos ambientais (se houver)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>
    </div>
  );
}
