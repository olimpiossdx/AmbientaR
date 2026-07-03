'use client';

import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2 } from 'lucide-react';
import { TextAreaField, TextField } from './form-listagem-a-helpers';

export function FormListagemGTecnico({ form }: { form: any }) {
  const { fields: insumosFields, append: appendInsumo, remove: removeInsumo } = useFieldArray({
    control: form.control,
    name: 'listagemG.insumos',
  });
  const { fields: residuosFields, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: 'listagemG.residuosSolidos',
  });
  const { fields: anexosFields, append: appendAnexo, remove: removeAnexo } = useFieldArray({
    control: form.control,
    name: 'listagemG.anexos',
  });

  return (
    <Accordion type="multiple" defaultValue={['item-4']} className="w-full">
      <AccordionItem value="item-4">
        <AccordionTrigger>MÓDULO 4 – CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
        <AccordionContent className="space-y-6 p-1">
          <div className="space-y-4 rounded-md border p-3 sm:p-4">
            <h3 className="font-semibold">Atividade agrossilvipastoril</h3>
            <TextAreaField
              form={form}
              name="listagemG.agro.descricaoAtividade"
              label="Descrição da atividade principal"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField form={form} name="listagemG.agro.areaTotalHa" label="Área total do empreendimento (ha)" />
              <TextField form={form} name="listagemG.agro.areaProdutivaHa" label="Área produtiva (ha)" />
            </div>
          </div>
          <div className="space-y-4 rounded-md border p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">Insumos (defensivos, fertilizantes, rações)</h3>
              <Button size="sm" type="button" className="w-full sm:w-auto" onClick={() => appendInsumo({ nome: '', consumo: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar insumo
              </Button>
            </div>
            {insumosFields.map((item, index) => (
              <div key={item.id} className="relative space-y-2 rounded-md border p-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeInsumo(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`listagemG.insumos.${index}.nome`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insumo</FormLabel>
                        <FormControl>
                          <Input {...field} value={String(field.value ?? '')} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`listagemG.insumos.${index}.consumo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumo estimado</FormLabel>
                        <FormControl>
                          <Input {...field} value={String(field.value ?? '')} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-md border p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">Resíduos sólidos</h3>
              <Button size="sm" type="button" className="w-full sm:w-auto" onClick={() => appendResiduo({ nome: '', destino: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar resíduo
              </Button>
            </div>
            {residuosFields.map((item, index) => (
              <div key={item.id} className="relative grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeResiduo(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`listagemG.residuosSolidos.${index}.nome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resíduo</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`listagemG.residuosSolidos.${index}.destino`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger>MÓDULO 5 – IMPACTOS AMBIENTAIS</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <TextAreaField
            form={form}
            name="listagemG.agro.resumoImpactos"
            label="Quadro resumo dos possíveis impactos ambientais"
          />
          <TextAreaField
            form={form}
            name="listagemG.agro.medidasMitigadoras"
            label="Medidas mitigadoras / compensatórias"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger>MÓDULO 6 – ZONEAMENTO ECOLÓGICO-ECONÔMICO</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <TextAreaField
            form={form}
            name="listagemG.zee.observacoesFisico"
            label="Compatibilidade com o ZEE – meio físico"
          />
          <TextAreaField
            form={form}
            name="listagemG.agro.zeeSocioeconomico"
            label="Compatibilidade com o ZEE – meio socioeconômico"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-7">
        <AccordionTrigger>MÓDULO 7 – ANEXOS</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <div className="flex justify-end">
            <Button size="sm" type="button" className="w-full sm:w-auto" onClick={() => appendAnexo({ descricao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar anexo
            </Button>
          </div>
          {anexosFields.map((item, index) => (
            <div key={item.id} className="relative rounded-md border p-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => removeAnexo(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <FormField
                control={form.control}
                name={`listagemG.anexos.${index}.descricao`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anexo {index + 1}</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? '')} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
          <TextAreaField form={form} name="listagemG.anexosOutros" label="Outros anexos / observações" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
