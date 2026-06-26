'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { SectionCard, TextField } from './form-listagem-a-helpers';

const atividadesPapel = [
  {
    id: 'celulose',
    codigo: 'C-01-01-5',
    label: 'Fabricação de celulose',
    parametro: 'area_ou_empregados',
  },
  {
    id: 'pasta_mecanica',
    codigo: 'C-01-02-3',
    label: 'Fabricação de pasta mecânica',
    parametro: 'area_ou_empregados',
  },
  {
    id: 'papel_cartao',
    codigo: 'C-01-03-1',
    label:
      'Fabricação de papel, cartolina, cartão e polpa moldada, utilizando celulose e/ou papel reciclado como matéria-prima',
    parametro: 'capacidade',
  },
] as const;

export function FormListagemCSecao6Papel({ form }: { form: any }) {
  return (
    <SectionCard title="6. Atividade principal do empreendimento conforme DN 74/04">
      <div className="space-y-4">
        {atividadesPapel.map((atividade) => (
          <div key={atividade.id} className="space-y-3 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemC.papel.atividadesPrincipal.${atividade.id}.ativa`}
              render={({ field }) => (
                <FormItem className="flex items-start gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal leading-snug">{atividade.label}</FormLabel>
                    <p className="text-xs text-muted-foreground">Código DN-74/04: {atividade.codigo}</p>
                  </div>
                </FormItem>
              )}
            />
            {form.watch(`listagemC.papel.atividadesPrincipal.${atividade.id}.ativa`) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {atividade.parametro === 'capacidade' ? (
                  <>
                    <TextField
                      form={form}
                      name={`listagemC.papel.atividadesPrincipal.${atividade.id}.capacidadeTonDia`}
                      label="Capacidade instalada (ton/dia)"
                    />
                    <TextField
                      form={form}
                      name={`listagemC.papel.atividadesPrincipal.${atividade.id}.inicioAtividade`}
                      label="Início da atividade"
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      form={form}
                      name={`listagemC.papel.atividadesPrincipal.${atividade.id}.areaUtilHa`}
                      label="Área útil (ha)"
                    />
                    <TextField
                      form={form}
                      name={`listagemC.papel.atividadesPrincipal.${atividade.id}.numEmpregados`}
                      label="Nº de empregados"
                    />
                    <TextField
                      form={form}
                      name={`listagemC.papel.atividadesPrincipal.${atividade.id}.inicioAtividade`}
                      label="Início da atividade"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
