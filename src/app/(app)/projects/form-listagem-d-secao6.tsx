'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { SectionCard, TextField } from './form-listagem-a-helpers';
import {
  inferirFormularioListagemD,
  LISTAGEM_D_ACTIVITY_BY_TIPO,
  LISTAGEM_D_CODIGO_AGUARDENTE,
  LISTAGEM_D_FORM_TIPO_PADRAO,
} from './listagem-d-form-registry';
import { aplicarFormularioTipoListagem } from './listagem-form-inferencia';

export function FormListagemDSecao6({ form }: { form: any }) {
  return (
    <SectionCard title="6. Atividades do empreendimento conforme DN 217/17">
      <div className="rounded-md border p-3">
        <FormField
          control={form.control}
          name="listagemD.atividadePrincipal.aguardente.ativa"
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
                        'D',
                        inferirFormularioListagemD(LISTAGEM_D_CODIGO_AGUARDENTE),
                        LISTAGEM_D_ACTIVITY_BY_TIPO,
                        LISTAGEM_D_FORM_TIPO_PADRAO,
                      );
                    }
                  }}
                />
              </FormControl>
              <div>
                <FormLabel className="font-normal leading-snug">
                  Fabricação de aguardente
                </FormLabel>
                <p className="text-xs text-muted-foreground">Código DN-217/17: D-02-02-1 · Unidade: litros de produto/dia</p>
              </div>
            </FormItem>
          )}
        />
        {form.watch('listagemD.atividadePrincipal.aguardente.ativa') && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField form={form} name="listagemD.atividadePrincipal.aguardente.quantidade" label="Quantidade (L/dia)" />
            <TextField form={form} name="listagemD.atividadePrincipal.aguardente.inicioAtividade" label="Início da atividade" />
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Preencher o Termo de Referência da atividade principal. Demais atividades no item 12 (Módulo 4).
      </p>
    </SectionCard>
  );
}
