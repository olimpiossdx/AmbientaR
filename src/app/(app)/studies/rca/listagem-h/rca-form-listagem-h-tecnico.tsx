'use client';

import * as React from 'react';
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
import { RcaTextAreaField, RcaTextField } from '../listagem-a/rca-form-listagem-a-helpers';

export function RcaFormListagemHTecnico({ form }: { form: any }) {
  const { fields: especiesFields, append: appendEspecie, remove: removeEspecie } = useFieldArray({
    control: form.control,
    name: 'listagemH.flora.especiesAmostradas',
  });
  const { fields: anexosFields, append: appendAnexo, remove: removeAnexo } = useFieldArray({
    control: form.control,
    name: 'anexos',
  });

  return (
    <Accordion type="multiple" defaultValue={['item-4']} className="w-full">
      <AccordionItem value="item-4">
        <AccordionTrigger>MÓDULO 4 – CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <RcaTextAreaField
            form={form}
            name="listagemH.entorno.caracterizacaoBiotica"
            label="Caracterização biótica do entorno"
          />
          <RcaTextAreaField
            form={form}
            name="listagemH.entorno.unidadesConservacaoProximas"
            label="Unidades de conservação / APPs / RL no entorno"
          />
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Espécies amostradas (inventário)</h3>
            <div className="flex justify-end">
              <Button size="sm" type="button" onClick={() => appendEspecie({})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar espécie
              </Button>
            </div>
            {especiesFields.map((item, index) => (
              <div key={item.id} className="relative grid grid-cols-2 gap-2 rounded-md border p-2 md:grid-cols-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeEspecie(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`listagemH.flora.especiesAmostradas.${index}.nome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espécie</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`listagemH.flora.especiesAmostradas.${index}.dap`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DAP (cm)</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`listagemH.flora.especiesAmostradas.${index}.altura`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (m)</FormLabel>
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
          <RcaTextAreaField
            form={form}
            name="listagemH.impactos.resumo"
            label="Quadro resumo dos impactos da supressão e do empreendimento"
          />
          <RcaTextAreaField
            form={form}
            name="listagemH.impactos.medidasMitigadoras"
            label="Medidas mitigadoras e de compensação"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger>MÓDULO 6 – ZONEAMENTO ECOLÓGICO-ECONÔMICO</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <RcaTextField
            form={form}
            name="listagemH.zee.tipologia"
            label="Tipologia ZEE do empreendimento"
          />
          <RcaTextAreaField
            form={form}
            name="listagemH.zee.compatibilidade"
            label="Compatibilidade com o zoneamento ecológico-econômico"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-7">
        <AccordionTrigger>MÓDULO 7 – ANEXOS</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <div className="flex justify-end">
            <Button size="sm" type="button" onClick={() => appendAnexo({ descricao: '' })}>
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
                name={`anexos.${index}.descricao`}
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
          <RcaTextAreaField form={form} name="anexosOutros" label="Outros anexos (mapas, ART, laudos…)" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
