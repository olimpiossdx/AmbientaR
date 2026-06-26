'use client';

import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MaskedInput } from '@/components/ui/masked-input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UfMunicipioFields } from '@/components/listagem-g/uf-municipio-fields';
import type { Empreendedor } from '@/lib/types';
import { SectionCard, TextField } from './form-listagem-a-helpers';

type FormListagemGShellProps = {
  form: any;
  empreendedor?: Empreendedor | null;
};

function setIfEmpty(form: any, path: string, value: string | undefined) {
  if (!value?.trim()) return;
  const current = form.getValues(path);
  if (current == null || current === '') {
    form.setValue(path, value, { shouldDirty: false });
  }
}

export function FormListagemGShell({ form, empreendedor }: FormListagemGShellProps) {
  React.useEffect(() => {
    if (empreendedor) {
      setIfEmpty(form, 'listagemG.empreendedor.nome', empreendedor.name);
      setIfEmpty(form, 'listagemG.empreendedor.cpfCnpj', empreendedor.cpfCnpj);
      setIfEmpty(form, 'listagemG.empreendedor.endereco', empreendedor.address);
      setIfEmpty(form, 'listagemG.empreendedor.uf', empreendedor.uf);
      setIfEmpty(form, 'listagemG.empreendedor.municipio', empreendedor.municipio);
      setIfEmpty(form, 'listagemG.empreendedor.email', empreendedor.email);
      setIfEmpty(form, 'listagemG.empreendedor.fone', empreendedor.phone);
    }

    setIfEmpty(form, 'listagemG.empreendimento.nome', form.getValues('propertyName'));
    setIfEmpty(form, 'listagemG.empreendimento.nomeFantasia', form.getValues('fantasyName'));
    setIfEmpty(form, 'listagemG.empreendimento.cnpj', form.getValues('cnpj'));
    setIfEmpty(form, 'listagemG.empreendimento.endereco', form.getValues('address'));
    setIfEmpty(form, 'listagemG.empreendimento.uf', form.getValues('uf'));
    setIfEmpty(form, 'listagemG.empreendimento.municipio', form.getValues('municipio'));
    setIfEmpty(form, 'listagemG.empreendimento.cep', form.getValues('cep'));
  }, [form, empreendedor]);

  return (
    <Accordion type="multiple" defaultValue={['empreendedor', 'empreendimento']} className="w-full">
      <AccordionItem value="empreendedor">
        <AccordionTrigger>Identificação do empreendedor</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <SectionCard title="1. Empreendedor">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField form={form} name="listagemG.empreendedor.nome" label="Nome / razão social" />
              <FormField
                control={form.control}
                name="listagemG.empreendedor.cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / CNPJ</FormLabel>
                    <FormControl>
                      <MaskedInput
                        mask="cpfCnpj"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <TextField form={form} name="listagemG.empreendedor.endereco" label="Endereço" className="mt-4" />
            <UfMunicipioFields
              form={form}
              ufName="listagemG.empreendedor.uf"
              municipioName="listagemG.empreendedor.municipio"
              className="mt-4"
            />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField form={form} name="listagemG.empreendedor.email" label="E-mail" />
              <TextField form={form} name="listagemG.empreendedor.fone" label="Telefone" />
            </div>
          </SectionCard>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="empreendimento">
        <AccordionTrigger>Identificação do empreendimento</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <SectionCard title="2. Empreendimento">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField form={form} name="listagemG.empreendimento.nome" label="Nome / razão social" />
              <TextField form={form} name="listagemG.empreendimento.nomeFantasia" label="Nome fantasia" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="listagemG.empreendimento.cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ / CPF</FormLabel>
                    <FormControl>
                      <MaskedInput
                        mask="cpfCnpj"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <TextField form={form} name="listagemG.empreendimento.codigoDn" label="Código DN-217/2017" />
            </div>
            <TextField form={form} name="listagemG.empreendimento.endereco" label="Endereço" className="mt-4" />
            <UfMunicipioFields
              form={form}
              ufName="listagemG.empreendimento.uf"
              municipioName="listagemG.empreendimento.municipio"
              className="mt-4"
            />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="listagemG.empreendimento.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <MaskedInput mask="cep" placeholder="00000-000" maxLength={9} {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <TextField form={form} name="listagemG.empreendimento.email" label="E-mail" />
            </div>
          </SectionCard>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
