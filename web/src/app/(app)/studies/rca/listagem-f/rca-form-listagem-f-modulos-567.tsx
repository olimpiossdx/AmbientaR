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
import { RcaSectionCard, RcaTextAreaField, RcaTextField } from '../listagem-a/rca-form-listagem-a-helpers';

const camposFisica = [
  'Regime climático',
  'Geologia',
  'Classe do solo',
  'Estrutura do solo',
  'Permeabilidade do solo',
  'Profundidade do lençol freático',
  'Fluxo do lençol freático',
];

const camposBioticos = ['Bioma', 'Ecossistema', 'Flora, fauna e antropização', 'Outra caracterização'];

const camposSocio = [
  'Principais atividades econômicas do município',
  'Gestão ambiental do município',
  'Importância socioeconômica do empreendimento',
];

const camadasZee = [
  'Declividade',
  'Pedologia',
  'Vegetação',
  'Hidrografia',
  'Clima',
  'Uso do solo',
];

export function RcaFormListagemFModulos567({ form }: { form: any }) {
  const { fields: anexosFields, append: appendAnexo, remove: removeAnexo } = useFieldArray({
    control: form.control,
    name: 'anexos',
  });

  return (
    <Accordion type="multiple" defaultValue={['item-5']} className="w-full">
      <AccordionItem value="item-5">
        <AccordionTrigger>MÓDULO 5 – CARACTERIZAÇÃO AMBIENTAL</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <RcaSectionCard title="31. Caracterização física">
            {camposFisica.map((campo) => (
              <RcaTextField
                key={campo}
                form={form}
                name={`listagemF.caracterizacao.fisica.${campo.replace(/\s+/g, '_')}`}
                label={campo}
              />
            ))}
          </RcaSectionCard>
          <RcaSectionCard title="32. Caracterização biótica">
            {camposBioticos.map((campo) => (
              <RcaTextField
                key={campo}
                form={form}
                name={`listagemF.caracterizacao.biotica.${campo.replace(/\s+/g, '_')}`}
                label={campo}
              />
            ))}
          </RcaSectionCard>
          <RcaSectionCard title="33. Caracterização socioeconômica">
            {camposSocio.map((campo) => (
              <RcaTextField
                key={campo}
                form={form}
                name={`listagemF.caracterizacao.socioeconomica.${campo.replace(/\s+/g, '_')}`}
                label={campo}
              />
            ))}
            <RcaTextAreaField
              form={form}
              name="listagemF.caracterizacao.observacoes"
              label="Outras observações / anexos"
            />
          </RcaSectionCard>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger>MÓDULO 6 – ZONEAMENTO ECOLÓGICO-ECONÔMICO</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <RcaSectionCard title="Compatibilidade com o ZEE – meio físico">
            {camadasZee.map((camada) => (
              <RcaTextField
                key={camada}
                form={form}
                name={`listagemF.zee.geofisico.${camada.replace(/\s+/g, '_')}`}
                label={camada}
              />
            ))}
          </RcaSectionCard>
          <RcaTextAreaField
            form={form}
            name="listagemF.zee.socioeconomico"
            label="Compatibilidade com o ZEE – meio socioeconômico"
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
          <RcaTextAreaField form={form} name="anexosOutros" label="Outros anexos / observações" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
