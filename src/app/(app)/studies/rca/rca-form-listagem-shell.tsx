'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BrDateFormControl } from '@/components/form/br-date-input';
import type { UseFormReturn } from 'react-hook-form';
import { StudyEmpreendedorProjectFields } from '@/components/studies/study-empreendedor-project-fields';
import {
  RcaTextField,
} from '@/app/(app)/studies/rca/listagem-a/rca-form-listagem-a-helpers';

export type RcaFormListagemShellProps = {
  form: UseFormReturn<any>;
  readOnlyEmpreendimento?: boolean;
  /** Exibe campos do termo de referência na secção de identificação. */
  showTermoReferencia?: boolean;
};

export function RcaFormListagemShell({
  form,
  readOnlyEmpreendimento = false,
  showTermoReferencia = true,
}: RcaFormListagemShellProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={['identificacao', 'empreendimento']}
      className="w-full"
    >
      <AccordionItem value="identificacao">
        <AccordionTrigger>Identificação e empreendedor</AccordionTrigger>
        <AccordionContent className="space-y-4">
          {showTermoReferencia && (
            <>
              <RcaTextField
                form={form}
                name="termoReferencia.titulo"
                label="Título do termo de referência"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <RcaTextField
                  form={form}
                  name="termoReferencia.processo"
                  label="Nº do processo"
                />
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
                <RcaTextField
                  form={form}
                  name="termoReferencia.versao"
                  label="Versão"
                />
              </div>
            </>
          )}

          <StudyEmpreendedorProjectFields
            form={form}
            empreendedorName="empreendedor.clientId"
            showProject={false}
            disabled={readOnlyEmpreendimento}
          />
          <RcaTextField form={form} name="empreendedor.nome" label="Nome / razão social" />
          <div className="grid gap-4 md:grid-cols-2">
            <RcaTextField form={form} name="empreendedor.cpfCnpj" label="CPF / CNPJ" />
            <RcaTextField form={form} name="empreendedor.fone" label="Telefone" />
          </div>
          <RcaTextField form={form} name="empreendedor.email" label="E-mail" />
          <RcaTextField form={form} name="empreendedor.endereco" label="Endereço" />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="empreendimento">
        <AccordionTrigger>Empreendimento</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <StudyEmpreendedorProjectFields
            form={form}
            empreendedorName="empreendedor.clientId"
            showEmpreendedor={false}
            disabled={readOnlyEmpreendimento}
          />
          <RcaTextField form={form} name="empreendimento.nome" label="Nome do empreendimento" />
          <div className="grid gap-4 md:grid-cols-2">
            <RcaTextField form={form} name="empreendimento.municipio" label="Município" />
            <RcaTextField form={form} name="empreendimento.uf" label="UF" />
          </div>
          <RcaTextField form={form} name="empreendimento.endereco" label="Endereço" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
