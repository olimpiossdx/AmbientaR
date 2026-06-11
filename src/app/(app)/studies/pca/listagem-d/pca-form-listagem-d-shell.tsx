'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { UseFormReturn } from 'react-hook-form';
import type { Empreendedor, Project } from '@/lib/types';
import { filterProjectsByEmpreendedorId } from '@/lib/processos-form-order';
import { PcaTextField, PcaTextAreaField } from '../listagem-a/pca-form-listagem-a-helpers';
import type { PcaListagemDFormValues } from './pca-listagem-d-schema';
import { PCA_LISTAGEM_D_SUBACTIVITIES } from '@/lib/pca/pca-listagem-d-catalog';

type PcaFormListagemDShellProps = {
  form: UseFormReturn<PcaListagemDFormValues>;
  clients: Empreendedor[];
  projects: Project[];
  isLoadingClients: boolean;
  isLoadingProjects: boolean;
  readOnlyEmpreendimento?: boolean;
};

export function PcaFormListagemDShell({
  form,
  clients,
  projects,
  isLoadingClients,
  isLoadingProjects,
  readOnlyEmpreendimento,
}: PcaFormListagemDShellProps) {
  const clientId = form.watch('empreendedor.clientId');
  const projectsForSelect = filterProjectsByEmpreendedorId(projects, clientId);

  return (
    <Accordion type="multiple" defaultValue={['identificacao', 'empreendimento']} className="w-full">
      <AccordionItem value="identificacao">
        <AccordionTrigger>Identificação e empreendedor</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <FormField
            control={form.control}
            name="termoReferencia.titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do termo de referência</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <PcaTextField form={form as never} name="termoReferencia.processo" label="Nº do processo" />
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
            <PcaTextField form={form as never} name="termoReferencia.versao" label="Versão" />
          </div>

          <FormField
            control={form.control}
            name="subActivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subatividade (Listagem D)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subatividade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PCA_LISTAGEM_D_SUBACTIVITIES.map((opt) => (
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

          <FormField
            control={form.control}
            name="empreendedor.clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendedor cadastrado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={isLoadingClients || readOnlyEmpreendimento}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? 'Carregando…' : 'Selecione'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <PcaTextField form={form as never} name="empreendedor.nome" label="Nome / razão social" />
          <div className="grid gap-4 md:grid-cols-2">
            <PcaTextField form={form as never} name="empreendedor.cpfCnpj" label="CPF / CNPJ" />
            <PcaTextField form={form as never} name="empreendedor.contato" label="Contato" />
          </div>
          <PcaTextField form={form as never} name="empreendedor.endereco" label="Endereço" />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="empreendimento">
        <AccordionTrigger>Empreendimento</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <FormField
            control={form.control}
            name="empreendimento.projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendimento cadastrado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={isLoadingProjects || readOnlyEmpreendimento}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingProjects ? 'Carregando…' : 'Selecione'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projectsForSelect.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyName || p.fantasyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <PcaTextField form={form as never} name="empreendimento.nome" label="Nome do empreendimento" />
          <div className="grid gap-4 md:grid-cols-2">
            <PcaTextField form={form as never} name="empreendimento.municipio" label="Município" />
            <PcaTextField form={form as never} name="empreendimento.codigoDn" label="Código DN-217/2017" />
          </div>
          <PcaTextField form={form as never} name="empreendimento.endereco" label="Endereço" />
          <PcaTextField form={form as never} name="empreendimento.coordenadas" label="Coordenadas" />
          <div className="grid gap-4 md:grid-cols-2">
            <PcaTextField form={form as never} name="empreendimento.tipologia" label="Classe / tipologia" />
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
          <PcaTextField form={form as never} name="objetoEstudo.objeto" label="Objeto do estudo" />
          <PcaTextAreaField form={form as never} name="objetoEstudo.fundamentacaoLegal" label="Fundamentação legal" />
          <PcaTextAreaField form={form as never} name="conteudoEstudo.introducao" label="Introdução" />
          <PcaTextAreaField
            form={form as never}
            name="conteudoEstudo.caracterizacaoEmpreendimento"
            label="Caracterização do empreendimento"
          />
          <PcaTextAreaField form={form as never} name="conteudoEstudo.diagnosticoMeioFisico" label="Diagnóstico – meio físico" />
          <PcaTextAreaField form={form as never} name="conteudoEstudo.diagnosticoMeioBiotico" label="Diagnóstico – meio biótico" />
          <PcaTextAreaField
            form={form as never}
            name="conteudoEstudo.diagnosticoMeioSocioeconomico"
            label="Diagnóstico – meio socioeconômico"
          />
          <PcaTextAreaField form={form as never} name="conteudoEstudo.programasAmbientais" label="Programas ambientais" />
          <PcaTextAreaField form={form as never} name="conteudoEstudo.conclusao" label="Conclusão" />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="equipe">
        <AccordionTrigger>Equipe técnica</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <PcaTextAreaField form={form as never} name="equipeTecnica.qualificacoes" label="Qualificações" />
          <PcaTextAreaField form={form as never} name="equipeTecnica.arts" label="ARTs / RRTs" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
