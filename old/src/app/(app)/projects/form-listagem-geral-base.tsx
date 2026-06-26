'use client';

import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BooleanRadio, SectionCard, TextField } from './form-listagem-a-helpers';
import type { ListagemLetter } from './listagem-form-activity';
import { aplicarFormularioTipoListagem } from './listagem-form-inferencia';

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
  hideIdentificacao?: boolean;
  hideAtividades?: boolean;
}

/**
 * Formulário geral reutilizável por listagem (dados em listagemX.geral.*).
 */
export function FormListagemGeralBase({
  form,
  letter,
  dataPrefix,
  title,
  description,
  inferirFormulario,
  activityByTipo,
  defaultTipo,
  hideIdentificacao,
  hideAtividades,
}: FormListagemGeralBaseProps) {
  const onCodigoBlur = (codigo: string) => {
    if (!inferirFormulario || !activityByTipo || !defaultTipo || !codigo.trim()) return;
    aplicarFormularioTipoListagem(
      form,
      letter,
      inferirFormulario(codigo),
      activityByTipo,
      defaultTipo,
    );
  };
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `${dataPrefix}.geral.atividades`,
  });

  return (
    <div className="space-y-6">
      <SectionCard title={title}>
        <FormDescription>
          {description} Dados em <code className="text-xs">{dataPrefix}.geral</code>, separados das fichas
          específicas da Listagem {letter}.
        </FormDescription>
      </SectionCard>

      {!hideIdentificacao && (
      <SectionCard title="Identificação resumida do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField form={form} name={`${dataPrefix}.geral.empreendimento.nome`} label="Nome / razão social" />
          <TextField form={form} name={`${dataPrefix}.geral.empreendimento.cnpj`} label="CNPJ / CPF" />
          <TextField form={form} name={`${dataPrefix}.geral.empreendimento.municipio`} label="Município" />
          <TextField form={form} name={`${dataPrefix}.geral.empreendimento.uf`} label="UF" />
          <TextField
            form={form}
            name={`${dataPrefix}.geral.empreendimento.localizacao`}
            label="Localização / endereço"
            className="md:col-span-2"
          />
        </div>
      </SectionCard>
      )}

      {!hideAtividades && (
      <SectionCard title="Atividades (DN 217/17)">
        {fields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`${dataPrefix}.geral.atividades.${index}.descricao`} label="Atividade" />
            <TextField
              form={form}
              name={`${dataPrefix}.geral.atividades.${index}.codigo`}
              label="Código DN"
              onBlur={(e) => onCodigoBlur(e.target.value)}
            />
            <TextField form={form} name={`${dataPrefix}.geral.atividades.${index}.unidade`} label="Unidade" />
            <TextField form={form} name={`${dataPrefix}.geral.atividades.${index}.quantidade`} label="Quantidade" />
            <TextField form={form} name={`${dataPrefix}.geral.atividades.${index}.inicio`} label="Início" />
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
      </SectionCard>
      )}

      <SectionCard title="Licenciamento">
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
        <TextField form={form} name={`${dataPrefix}.geral.licenciamento.classe`} label="Classe" />
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
        <TextField form={form} name={`${dataPrefix}.geral.licenciamento.processo`} label="Nº processo (se aplicável)" />
      </SectionCard>

      <SectionCard title="Informações complementares">
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
      </SectionCard>
    </div>
  );
}
