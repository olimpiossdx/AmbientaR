'use client';

import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, SectionCard, TextAreaField, TextField } from './form-listagem-a-helpers';

const fasesLicenciamento = ['LP', 'LI', 'LIC', 'LP+LI', 'LO', 'LOC'] as const;

export function FormListagemGCulturas({ form }: { form: any }) {
  const { fields: olericulturaFields, append: appendOlericultura, remove: removeOlericultura } = useFieldArray({
    control: form.control,
    name: 'listagemG.culturas.olericultura',
  });
  const { fields: culturasAnuaisFields, append: appendCulturasAnuais, remove: removeCulturasAnuais } = useFieldArray({
    control: form.control,
    name: 'listagemG.culturas.culturasAnuais',
  });
  const { fields: culturasPerenesFields, append: appendCulturasPerenes, remove: removeCulturasPerenes } = useFieldArray({
    control: form.control,
    name: 'listagemG.culturas.culturasPerenes',
  });

  return (
    <Accordion type="multiple" defaultValue={['culturas', 'licenciamento']} className="w-full">
      <AccordionItem value="culturas">
        <AccordionTrigger>MÓDULO – CULTURAS E ÁREAS PRODUTIVAS</AccordionTrigger>
        <AccordionContent className="space-y-6 p-1">
          <SectionCard title="Olericultura">
            {olericulturaFields.map((item, index) => (
              <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-3">
                <TextField form={form} name={`listagemG.culturas.olericultura.${index}.cultura`} label="Cultura" />
                <TextField form={form} name={`listagemG.culturas.olericultura.${index}.area`} label="Área (ha)" />
                <TextField form={form} name={`listagemG.culturas.olericultura.${index}.producao`} label="Produção estimada" />
                <div className="flex justify-end sm:col-span-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeOlericultura(index)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => appendOlericultura({ cultura: '', area: '', producao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar olericultura
            </Button>
          </SectionCard>

          <SectionCard title="Culturas anuais">
            {culturasAnuaisFields.map((item, index) => (
              <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-3">
                <TextField form={form} name={`listagemG.culturas.culturasAnuais.${index}.cultura`} label="Cultura" />
                <TextField form={form} name={`listagemG.culturas.culturasAnuais.${index}.area`} label="Área (ha)" />
                <TextField form={form} name={`listagemG.culturas.culturasAnuais.${index}.producao`} label="Produção estimada" />
                <div className="flex justify-end sm:col-span-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeCulturasAnuais(index)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => appendCulturasAnuais({ cultura: '', area: '', producao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar cultura anual
            </Button>
          </SectionCard>

          <SectionCard title="Culturas perenes">
            {culturasPerenesFields.map((item, index) => (
              <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-3">
                <TextField form={form} name={`listagemG.culturas.culturasPerenes.${index}.cultura`} label="Cultura" />
                <TextField form={form} name={`listagemG.culturas.culturasPerenes.${index}.area`} label="Área (ha)" />
                <TextField form={form} name={`listagemG.culturas.culturasPerenes.${index}.producao`} label="Produção estimada" />
                <div className="flex justify-end sm:col-span-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeCulturasPerenes(index)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => appendCulturasPerenes({ cultura: '', area: '', producao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar cultura perene
            </Button>
          </SectionCard>

          <TextAreaField
            form={form}
            name="listagemG.culturas.praticasConservacao"
            label="Práticas de conservação do solo, água e biota"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="licenciamento">
        <AccordionTrigger>8. Fase da regularização ambiental</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <FormField
            control={form.control}
            name="listagemG.culturas.licenciamento.fase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fase de licenciamento</FormLabel>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {fasesLicenciamento.map((fase) => (
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
          <TextField form={form} name="listagemG.culturas.licenciamento.classe" label="Classe" />
          <FormField
            control={form.control}
            name="listagemG.culturas.licenciamento.ampliacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ampliação/modificação de empreendimento já licenciado?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <TextField form={form} name="listagemG.culturas.licenciamento.processo" label="Nº processo (se aplicável)" />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="responsaveis">
        <AccordionTrigger>Responsáveis técnicos e ambientais</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <SectionCard title="Responsável pela área ambiental">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField form={form} name="listagemG.culturas.responsavelAmbiental.nome" label="Nome" />
              <TextField form={form} name="listagemG.culturas.responsavelAmbiental.cpf" label="CPF" />
              <TextField form={form} name="listagemG.culturas.responsavelAmbiental.registroConselho" label="Registro no conselho" />
              <TextField form={form} name="listagemG.culturas.responsavelAmbiental.art" label="ART / RRT" />
            </div>
          </SectionCard>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
