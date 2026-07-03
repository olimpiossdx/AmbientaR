'use client';

import { CheckboxOptions, SectionCard, TextField } from './form-listagem-a-helpers';

export function FormListagemEEmpreendedor({ form }: { form: any }) {
  return (
    <SectionCard title="1. Identificação do empreendedor">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField form={form} name="listagemE.empreendedor.nome" label="Nome" className="md:col-span-2" />
        <TextField form={form} name="listagemE.empreendedor.cpfCnpj" label="CPF / CNPJ" />
        <TextField form={form} name="listagemE.empreendedor.identidade" label="Identidade" />
        <TextField form={form} name="listagemE.empreendedor.orgaoExpedidor" label="Órgão expedidor" />
        <TextField form={form} name="listagemE.empreendedor.ufIdentidade" label="UF" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TextField form={form} name="listagemE.empreendedor.endereco" label="Endereço" className="md:col-span-3" />
        <TextField form={form} name="listagemE.empreendedor.caixaPostal" label="Caixa postal" />
        <TextField form={form} name="listagemE.empreendedor.municipio" label="Município" />
        <TextField form={form} name="listagemE.empreendedor.distrito" label="Distrito ou localidade" />
        <TextField form={form} name="listagemE.empreendedor.uf" label="UF" />
        <TextField form={form} name="listagemE.empreendedor.cep" label="CEP" />
        <TextField form={form} name="listagemE.empreendedor.ddd" label="DDD" />
        <TextField form={form} name="listagemE.empreendedor.fone" label="Fone" />
        <TextField form={form} name="listagemE.empreendedor.fax" label="Fax" />
        <TextField form={form} name="listagemE.empreendedor.email" label="E-mail" className="md:col-span-2" />
      </div>
      <CheckboxOptions
        form={form}
        name="listagemE.empreendedor.tipoPessoa"
        options={[
          { id: 'fisica', label: 'Pessoa física' },
          { id: 'juridica', label: 'Pessoa jurídica' },
        ]}
      />
      <TextField form={form} name="listagemE.empreendedor.cadastroProdutorRural" label="Cadastro de Produtor Rural – PR" />
      <CheckboxOptions
        form={form}
        name="listagemE.empreendedor.condicao"
        options={[
          { id: 'proprietario', label: 'Proprietário' },
          { id: 'arrendatario', label: 'Arrendatário' },
          { id: 'parceiro', label: 'Parceiro' },
          { id: 'posseiro', label: 'Posseiro' },
          { id: 'outros', label: 'Outros' },
        ]}
      />
    </SectionCard>
  );
}
