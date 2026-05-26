'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { SectionCard, TextField } from './form-listagem-a-helpers';
import {
  inferirFormularioListagemF,
  LISTAGEM_F_ACTIVITY_BY_TIPO,
  LISTAGEM_F_CODIGO_POSTO,
  LISTAGEM_F_FORM_TIPO_PADRAO,
} from './listagem-f-form-registry';
import { aplicarFormularioTipoListagem } from './listagem-form-inferencia';

export function FormListagemFSecao6({ form }: { form: any }) {
  return (
    <SectionCard title="6. Atividades do empreendimento conforme DN 217/17">
      <div className="rounded-md border p-3">
        <FormField
          control={form.control}
          name="listagemF.atividadePrincipal.postoRevendedor.ativa"
          render={({ field }) => (
            <FormItem className="flex items-start gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={Boolean(field.value)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    field.onChange(checked);
                    if (checked) {
                      aplicarFormularioTipoListagem(
                        form,
                        'F',
                        inferirFormularioListagemF(LISTAGEM_F_CODIGO_POSTO),
                        LISTAGEM_F_ACTIVITY_BY_TIPO,
                        LISTAGEM_F_FORM_TIPO_PADRAO,
                      );
                    }
                  }}
                />
              </FormControl>
              <div>
                <FormLabel className="font-normal leading-snug">Posto revendedor</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Código F-06-01-7 · Unidade: capacidade de armazenamento (L)
                </p>
              </div>
            </FormItem>
          )}
        />
        {form.watch('listagemF.atividadePrincipal.postoRevendedor.ativa') && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              form={form}
              name="listagemF.atividadePrincipal.postoRevendedor.quantidadeL"
              label="Quantidade (L)"
            />
            <TextField
              form={form}
              name="listagemF.atividadePrincipal.postoRevendedor.inicioAtividade"
              label="Início da atividade"
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
