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
import { PcaFormListagemFEmpreendedor } from './pca-form-listagem-f-empreendedor';
import {
  inferirFormularioPcaListagemF,
  PCA_LISTAGEM_F_ACTIVITY_BY_TIPO,
  PCA_LISTAGEM_F_FORM_TIPO_PADRAO,
} from './pca-listagem-f-registry';
export function PcaFormListagemFGeral({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'listagemF.geral.atividades',
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="Listagem F – formulário geral">
        <FormDescription>
          Para atividades da Listagem F sem ficha RCA específica. Dados em{' '}
          <code className="text-xs">listagemF.geral</code>, separados do posto de combustível.
        </FormDescription>
      </PcaSectionCard>

      <PcaFormListagemFEmpreendedor form={form} />

      <PcaSectionCard title="Empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaTextField form={form} name="listagemF.geral.empreendimento.nome" label="Nome / razão social" />
          <PcaTextField form={form} name="listagemF.geral.empreendimento.cnpj" label="CNPJ" />
          <PcaTextField form={form} name="listagemF.geral.empreendimento.endereco" label="Endereço" className="md:col-span-2" />
          <PcaTextField form={form} name="listagemF.geral.empreendimento.municipio" label="Município" />
          <PcaTextField form={form} name="listagemF.geral.empreendimento.uf" label="UF" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="Atividades (DN 217/17)">
        {fields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <PcaTextField form={form} name={`listagemF.geral.atividades.${index}.descricao`} label="Atividade" />
            <PcaTextField
              form={form}
              name={`listagemF.geral.atividades.${index}.codigo`}
              label="Código DN"
            />
            <PcaTextField form={form} name={`listagemF.geral.atividades.${index}.unidade`} label="Unidade" />
            <PcaTextField form={form} name={`listagemF.geral.atividades.${index}.quantidade`} label="Quantidade" />
            <PcaTextField form={form} name={`listagemF.geral.atividades.${index}.inicio`} label="Início" />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ descricao: '', codigo: '', unidade: '', quantidade: '', inicio: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar atividade
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="Licenciamento">
        <FormField
          control={form.control}
          name="listagemF.geral.licenciamento.fase"
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
        <PcaTextField form={form} name="listagemF.geral.licenciamento.classe" label="Classe" />
        <FormField
          control={form.control}
          name="listagemF.geral.licenciamento.ampliacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ampliação de empreendimento licenciado?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="Informações complementares">
        <FormField
          control={form.control}
          name="listagemF.geral.observacoes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea rows={6} placeholder="Descrição técnica e referência a anexos..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>
    </div>
  );
}
