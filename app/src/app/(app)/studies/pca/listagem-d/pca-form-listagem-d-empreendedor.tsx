'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CaracterizacaoEfluenteAntesDepois,
  DetalhesControleEmissoes,
  DisposicaoTemporariaResiduo,
  PcaCheckboxOptions,
  PcaNumField,
  PcaSectionCard,
  PcaSituacaoRegularizacao,
  PcaTabelaLinhasFixas,
  PcaTextField,
  PcaTextAreaField,
} from '../lib/pca-form-helpers';
import { PcaMedidasSection } from '../lib/pca-medidas-section';
export function PcaFormListagemDEmpreendedor({ form }: { form: any }) {
  return (
    <PcaSectionCard title="1. Identificação do empreendedor">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PcaTextField form={form} name="listagemD.empreendedor.nome" label="Nome" className="md:col-span-2" />
        <PcaTextField form={form} name="listagemD.empreendedor.cpfCnpj" label="CPF / CNPJ" />
        <PcaTextField form={form} name="listagemD.empreendedor.identidade" label="Identidade" />
        <PcaTextField form={form} name="listagemD.empreendedor.orgaoExpedidor" label="Órgão expedidor" />
        <PcaTextField form={form} name="listagemD.empreendedor.ufIdentidade" label="UF" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <PcaTextField form={form} name="listagemD.empreendedor.endereco" label="Endereço" className="md:col-span-3" />
        <PcaTextField form={form} name="listagemD.empreendedor.caixaPostal" label="Caixa postal" />
        <PcaTextField form={form} name="listagemD.empreendedor.municipio" label="Município" />
        <PcaTextField form={form} name="listagemD.empreendedor.distrito" label="Distrito ou localidade" />
        <PcaTextField form={form} name="listagemD.empreendedor.uf" label="UF" />
        <PcaTextField form={form} name="listagemD.empreendedor.cep" label="CEP" />
        <PcaTextField form={form} name="listagemD.empreendedor.ddd" label="DDD" />
        <PcaTextField form={form} name="listagemD.empreendedor.fone" label="Fone" />
        <PcaTextField form={form} name="listagemD.empreendedor.fax" label="Fax" />
        <PcaTextField form={form} name="listagemD.empreendedor.email" label="E-mail" className="md:col-span-2" />
      </div>
      <PcaCheckboxOptions
        form={form}
        name="listagemD.empreendedor.tipoPessoa"
        options={[
          { id: 'fisica', label: 'Pessoa física' },
          { id: 'juridica', label: 'Pessoa jurídica' },
        ]}
      />
      <PcaTextField form={form} name="listagemD.empreendedor.cadastroProdutorRural" label="Cadastro de Produtor Rural – PR" />
      <PcaCheckboxOptions
        form={form}
        name="listagemD.empreendedor.condicao"
        options={[
          { id: 'proprietario', label: 'Proprietário' },
          { id: 'arrendatario', label: 'Arrendatário' },
          { id: 'parceiro', label: 'Parceiro' },
          { id: 'posseiro', label: 'Posseiro' },
          { id: 'outros', label: 'Outros' },
        ]}
      />
      <PcaTextField form={form} name="listagemD.empreendedor.cargoFuncao" label="Cargo / função" />
    </PcaSectionCard>
  );
}
