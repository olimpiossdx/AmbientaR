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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BooleanRadio, SectionCard, TextField } from './form-listagem-a-helpers';
import { FormListagemEEmpreendedor } from './form-listagem-e-empreendedor';
import {
  inferirFormularioListagemE,
  LISTAGEM_E_ACTIVITY_BY_TIPO,
  LISTAGEM_E_FORM_TIPO_PADRAO,
} from './listagem-e-form-registry';
import { aplicarFormularioTipoListagem } from './listagem-form-inferencia';

/**
 * Formulário geral da Listagem E para atividades sem ficha RCA específica cadastrada.
 * Campos em listagemE.geral.* — não mistura com dutos_gasodutos.
 */
export function FormListagemEGeral({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'listagemE.geral.atividades',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="Listagem E – formulário geral">
        <FormDescription>
          Use este formulário quando a atividade não possuir anexo RCA específico no sistema. Os dados ficam em{' '}
          <code className="text-xs">listagemE.geral</code>, separados do formulário de dutos/gasodutos.
        </FormDescription>
      </SectionCard>

      <FormListagemEEmpreendedor form={form} />

      <SectionCard title="Identificação resumida do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField form={form} name="listagemE.geral.empreendimento.nome" label="Nome / razão social" />
          <TextField form={form} name="listagemE.geral.empreendimento.cnpj" label="CNPJ" />
          <TextField form={form} name="listagemE.geral.empreendimento.municipio" label="Município" />
          <TextField form={form} name="listagemE.geral.empreendimento.uf" label="UF" />
          <TextField form={form} name="listagemE.geral.empreendimento.localizacao" label="Localização / trecho" className="md:col-span-2" />
        </div>
      </SectionCard>

      <SectionCard title="Atividades (DN 217/17)">
        {fields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`listagemE.geral.atividades.${index}.descricao`} label="Atividade" />
            <TextField
              form={form}
              name={`listagemE.geral.atividades.${index}.codigo`}
              label="Código DN"
              onBlur={(e) => {
                const codigo = e.target.value;
                if (!codigo.trim()) return;
                aplicarFormularioTipoListagem(
                  form,
                  'E',
                  inferirFormularioListagemE(codigo),
                  LISTAGEM_E_ACTIVITY_BY_TIPO,
                  LISTAGEM_E_FORM_TIPO_PADRAO,
                );
              }}
            />
            <TextField form={form} name={`listagemE.geral.atividades.${index}.unidade`} label="Unidade" />
            <TextField form={form} name={`listagemE.geral.atividades.${index}.quantidade`} label="Quantidade" />
            <TextField form={form} name={`listagemE.geral.atividades.${index}.inicio`} label="Início" />
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
      </SectionCard>

      <SectionCard title="Licenciamento">
        <FormField
          control={form.control}
          name="listagemE.geral.licenciamento.fase"
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
        <TextField form={form} name="listagemE.geral.licenciamento.classe" label="Classe" />
        <FormField
          control={form.control}
          name="listagemE.geral.licenciamento.ampliacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ampliação/modificação de empreendimento licenciado?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemE.geral.licenciamento.processo" label="Nº processo (se aplicável)" />
      </SectionCard>

      <SectionCard title="Informações complementares">
        <FormField
          control={form.control}
          name="listagemE.geral.observacoes"
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
          name="listagemE.geral.passivosAmbientais"
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
