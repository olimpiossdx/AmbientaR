'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { UseFormReturn } from 'react-hook-form';
import type { Empreendedor, Project } from '@/lib/types';
import { PcaListagemShellEmpreendedorField, PcaListagemShellProjectField } from '@/components/studies/pca-listagem-shell-entity-fields';
import { PcaTextField, PcaTextAreaField, PcaCoordenadasReadOnlyField } from './pca-form-listagem-a-helpers';
import type { PcaListagemAFormValues } from './pca-listagem-a-schema';
import { PCA_LISTAGEM_A_SUBACTIVITIES } from '@/lib/pca/pca-listagem-a-catalog';

type PcaFormListagemAShellProps = {
  form: UseFormReturn<PcaListagemAFormValues>;
  clients: Empreendedor[];
  projects: Project[];
  isLoadingClients: boolean;
  isLoadingProjects: boolean;
  readOnlyEmpreendimento?: boolean;
};

export function PcaFormListagemAShell({
  form,
  clients,
  projects,
  isLoadingClients,
  isLoadingProjects,
  readOnlyEmpreendimento,
}: PcaFormListagemAShellProps) {
  return (
    <Accordion type="multiple" defaultValue={['identificacao', 'empreendimento']} className="w-full">
      <AccordionItem value="identificacao">
        <AccordionTrigger>Identificação e empreendedor</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <PcaTextField form={form} name="termoReferencia.titulo" label="Título do termo de referência" />
          <div className="grid gap-4 md:grid-cols-3">
            <PcaTextField form={form} name="termoReferencia.processo" label="Nº do processo" />
            <FormField
              control={form.control}
              name="termoReferencia.dataEmissao"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de emissão</FormLabel>
                  <FormControl>
                    <BrDateFormControl
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      asDate
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PcaTextField form={form} name="termoReferencia.versao" label="Versão" />
          </div>

          <FormField
            control={form.control}
            name="subActivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subatividade (Listagem A)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subatividade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PCA_LISTAGEM_A_SUBACTIVITIES.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <PcaListagemShellEmpreendedorField form={form} readOnlyEmpreendimento={readOnlyEmpreendimento} />
          <PcaTextField form={form} name="empreendedor.nome" label="Nome / razão social" />
          <div className="grid gap-4 md:grid-cols-2">
            <PcaTextField form={form} name="empreendedor.cpfCnpj" label="CPF / CNPJ" />
            <PcaTextField form={form} name="empreendedor.contato" label="Contato" />
          </div>
          <PcaTextField form={form} name="empreendedor.endereco" label="Endereço" />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="empreendimento">
        <AccordionTrigger>Empreendimento</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <PcaListagemShellProjectField form={form} readOnlyEmpreendimento={readOnlyEmpreendimento} />
          <PcaTextField form={form} name="empreendimento.nome" label="Nome do empreendimento" />
          <div className="grid gap-4 md:grid-cols-2">
            <PcaTextField form={form} name="empreendimento.municipio" label="Município" />
            <PcaTextField form={form} name="empreendimento.codigoDn" label="Código DN-217/2017" />
          </div>
          <PcaTextField form={form} name="empreendimento.endereco" label="Endereço" />
          <PcaCoordenadasReadOnlyField form={form} />
          <div className="grid gap-4 md:grid-cols-2">
            <PcaTextField form={form} name="empreendimento.tipologia" label="Classe / tipologia" />
            <FormField
              control={form.control}
              name="empreendimento.faseLicenciamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase do licenciamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['LP', 'LI', 'LO', 'AAF', 'Outra'].map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="objeto">
        <AccordionTrigger>Objeto e conteúdo do PCA</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <PcaTextField form={form} name="objetoEstudo.objeto" label="Objeto do estudo" />
          <PcaTextAreaField
            form={form}
            name="objetoEstudo.fundamentacaoLegal"
            label="Fundamentação legal"
          />
          <PcaTextAreaField form={form} name="conteudoEstudo.introducao" label="Introdução" />
          <PcaTextAreaField
            form={form}
            name="conteudoEstudo.caracterizacaoEmpreendimento"
            label="Caracterização do empreendimento"
          />
          <PcaTextAreaField
            form={form}
            name="conteudoEstudo.diagnosticoMeioFisico"
            label="Diagnóstico – meio físico"
          />
          <PcaTextAreaField
            form={form}
            name="conteudoEstudo.diagnosticoMeioBiotico"
            label="Diagnóstico – meio biótico"
          />
          <PcaTextAreaField
            form={form}
            name="conteudoEstudo.diagnosticoMeioSocioeconomico"
            label="Diagnóstico – meio socioeconômico"
          />
          <PcaTextAreaField
            form={form}
            name="conteudoEstudo.programasAmbientais"
            label="Programas ambientais"
          />
          <PcaTextAreaField form={form} name="conteudoEstudo.conclusao" label="Conclusão" />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="equipe">
        <AccordionTrigger>Equipe técnica</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <PcaTextAreaField
            form={form}
            name="equipeTecnica.qualificacoes"
            label="Qualificações"
          />
          <PcaTextAreaField form={form} name="equipeTecnica.arts" label="ARTs / RRTs" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
