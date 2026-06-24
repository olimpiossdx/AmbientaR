'use client';

import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SectionCard } from './form-listagem-a-helpers';
import { aplicarCodigoDnListagemG } from './listagem-form-inferencia';
import { lookupListagemGDn217 } from '@/lib/listagem-g/dn217-catalog';

interface FormListagemGSecao6Props {
  form: any;
}

function AtividadeRow({
  form,
  basePath,
  onCodigoBlur,
}: {
  form: any;
  basePath: string;
  onCodigoBlur: (codigo: string, index: number, prefix: 'atividadesPrincipal' | 'outrasAtividades') => void;
}) {
  const index = Number(basePath.split('.').pop());
  const prefix = basePath.includes('outrasAtividades') ? 'outrasAtividades' : 'atividadesPrincipal';
  const codigo = form.watch(`${basePath}.codigo`) as string | undefined;
  const catalogMatch = codigo ? lookupListagemGDn217(codigo) : null;

  return (
    <div className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <FormField
        control={form.control}
        name={`${basePath}.codigo`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código DN-217/2017</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder="G-01-03-1"
                onBlur={(e) => {
                  field.onBlur();
                  onCodigoBlur(e.target.value, index, prefix);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${basePath}.atividade`}
        render={({ field }) => (
          <FormItem className="sm:col-span-2 xl:col-span-2">
            <FormLabel>Atividade</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                readOnly={Boolean(catalogMatch)}
                className={catalogMatch ? 'bg-muted' : undefined}
                placeholder={catalogMatch ? undefined : 'Preencha ou informe o código DN'}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${basePath}.parametroUnidade`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parâmetro / Unidade</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${basePath}.quantidade`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantidade</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${basePath}.inicioAtividade`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Início da atividade</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

export function FormListagemGSecao6({ form }: FormListagemGSecao6Props) {
  const {
    fields: principalFields,
    append: appendPrincipal,
    remove: removePrincipal,
  } = useFieldArray({ control: form.control, name: 'listagemG.atividadesPrincipal' });
  const {
    fields: outrasFields,
    append: appendOutras,
    remove: removeOutras,
  } = useFieldArray({ control: form.control, name: 'listagemG.outrasAtividades' });

  const onCodigoBlur = (
    codigo: string,
    index: number,
    prefix: 'atividadesPrincipal' | 'outrasAtividades',
  ) => {
    if (!codigo.trim()) return;
    aplicarCodigoDnListagemG(form, codigo, { atividadeIndex: index, fieldPrefix: prefix });
  };

  const emptyRow = {
    atividade: '',
    codigo: '',
    parametroUnidade: '',
    quantidade: '',
    inicioAtividade: '',
  };

  return (
    <div className="space-y-6">
      <SectionCard title="6. Atividades do Empreendimento conforme DN 217/17">
        {principalFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Adicione a atividade principal. Ao informar o código DN, a descrição é preenchida automaticamente.
          </p>
        ) : null}
        {principalFields.map((item, index) => (
          <div key={item.id}>
            <AtividadeRow
              form={form}
              basePath={`listagemG.atividadesPrincipal.${index}`}
              onCodigoBlur={onCodigoBlur}
            />
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => removePrincipal(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remover atividade principal
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => appendPrincipal(emptyRow)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar atividade principal
        </Button>
      </SectionCard>

      <SectionCard title="7. Outras Atividades no Empreendimento">
        {outrasFields.map((item, index) => (
          <div key={item.id}>
            <AtividadeRow
              form={form}
              basePath={`listagemG.outrasAtividades.${index}`}
              onCodigoBlur={onCodigoBlur}
            />
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => removeOutras(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remover outra atividade
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => appendOutras(emptyRow)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar outra atividade
        </Button>
      </SectionCard>
    </div>
  );
}
