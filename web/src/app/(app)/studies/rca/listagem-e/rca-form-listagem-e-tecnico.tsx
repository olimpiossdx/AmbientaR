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
import type { Empreendedor as Client, Project } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { RcaTextAreaField, RcaTextField } from '../listagem-a/rca-form-listagem-a-helpers';

type RcaFormListagemETecnicoProps = {
  form: any;
  clients: Client[];
  isLoadingClients: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
};

export function RcaFormListagemETecnico({ form }: RcaFormListagemETecnicoProps) {
  const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } =
    useFieldArray({ control: form.control, name: 'materiasPrimas' });
  const { fields: equipamentosFields, append: appendEquipamento, remove: removeEquipamento } =
    useFieldArray({ control: form.control, name: 'equipamentosProducao' });
  const { fields: residuosFields, append: appendResiduo, remove: removeResiduo } =
    useFieldArray({ control: form.control, name: 'residuosSolidos' });
  const { fields: anexosFields, append: appendAnexo, remove: removeAnexo } =
    useFieldArray({ control: form.control, name: 'anexos' });

  return (
    <Accordion type="multiple" defaultValue={['item-4']} className="w-full">
      <AccordionItem value="item-4">
        <AccordionTrigger>MÓDULO 4 – CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
        <AccordionContent className="space-y-6 p-1">
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Regime de operação</h3>
            <RcaTextField form={form} name="regimeOperacao.turnos" label="Turnos / horário de operação" />
            <RcaTextField form={form} name="regimeOperacao.diasOperacao" label="Dias de operação por ano" />
          </div>
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Descrição do empreendimento</h3>
            <RcaTextAreaField
              form={form}
              name="processoProdutivo.descricao"
              label="Descrição geral do empreendimento e principais etapas"
            />
            <RcaTextField
              form={form}
              name="listagemE.infraestrutura.capacidadeInstalada"
              label="Capacidade instalada / dimensionamento"
            />
          </div>
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Insumos e materiais</h3>
            <div className="flex justify-end">
              <Button size="sm" type="button" onClick={() => appendMateriaPrima({})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar insumo
              </Button>
            </div>
            {materiasPrimasFields.map((item, index) => (
              <div key={item.id} className="relative space-y-2 rounded-md border p-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeMateriaPrima(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`materiasPrimas.${index}.nome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insumo / material</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`materiasPrimas.${index}.consumoMaximo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumo máximo</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Equipamentos principais</h3>
            <div className="flex justify-end">
              <Button size="sm" type="button" onClick={() => appendEquipamento({})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar equipamento
              </Button>
            </div>
            {equipamentosFields.map((item, index) => (
              <div key={item.id} className="relative space-y-2 rounded-md border p-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => removeEquipamento(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`equipamentosProducao.${index}.nome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamento</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`equipamentosProducao.${index}.quantidade`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="font-semibold">Resíduos sólidos (NBR 10.004)</h3>
            <div className="flex justify-end">
              <Button size="sm" type="button" onClick={() => appendResiduo({})}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar resíduo
              </Button>
            </div>
            {residuosFields.map((item, index) => (
              <div key={item.id} className="relative grid grid-cols-2 gap-2 rounded-md border p-2 md:grid-cols-3">
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
                  name={`residuosSolidos.${index}.nome`}
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
                  name={`residuosSolidos.${index}.classe`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe</FormLabel>
                      <FormControl>
                        <Input {...field} value={String(field.value ?? '')} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`residuosSolidos.${index}.taxa`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa mensal</FormLabel>
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
            name="listagemE.infraestrutura.resumoImpactos"
            label="Quadro resumo dos possíveis impactos ambientais"
          />
          <RcaTextAreaField
            form={form}
            name="listagemE.infraestrutura.medidasMitigadoras"
            label="Medidas mitigadoras / compensatórias previstas"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger>MÓDULO 6 – ZONEAMENTO ECOLÓGICO-ECONÔMICO</AccordionTrigger>
        <AccordionContent className="space-y-4 p-1">
          <RcaTextAreaField
            form={form}
            name="zeeGeofisico.observacoes"
            label="Compatibilidade com o ZEE – meio físico"
          />
          <RcaTextAreaField
            form={form}
            name="listagemE.infraestrutura.zeeSocioeconomico"
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
