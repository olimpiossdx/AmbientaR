'use client';

import { CheckboxOptions, SectionCard, TextField } from './form-listagem-a-helpers';

export function FormListagemFEmpreendedor({ form }: { form: any }) {
  return (
    <SectionCard title="1. Identificação do empreendedor">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField form={form} name="listagemF.empreendedor.nome" label="Nome" className="md:col-span-2" />
        <TextField form={form} name="listagemF.empreendedor.cpfCnpj" label="CPF / CNPJ" />
        <TextField form={form} name="listagemF.empreendedor.identidade" label="Identidade" />
        <TextField form={form} name="listagemF.empreendedor.orgaoExpedidor" label="Órgão expedidor" />
        <TextField form={form} name="listagemF.empreendedor.ufIdentidade" label="UF" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TextField form={form} name="listagemF.empreendedor.endereco" label="Endereço" className="md:col-span-3" />
        <TextField form={form} name="listagemF.empreendedor.caixaPostal" label="Caixa postal" />
        <TextField form={form} name="listagemF.empreendedor.municipio" label="Município" />
        <TextField form={form} name="listagemF.empreendedor.distrito" label="Distrito ou localidade" />
        <TextField form={form} name="listagemF.empreendedor.uf" label="UF" />
        <TextField form={form} name="listagemF.empreendedor.cep" label="CEP" />
        <TextField form={form} name="listagemF.empreendedor.ddd" label="DDD" />
        <TextField form={form} name="listagemF.empreendedor.fone" label="Fone" />
        <TextField form={form} name="listagemF.empreendedor.fax" label="Fax" />
        <TextField form={form} name="listagemF.empreendedor.email" label="E-mail" className="md:col-span-2" />
      </div>
      <CheckboxOptions
        form={form}
        name="listagemF.empreendedor.tipoPessoa"
        options={[
          { id: 'fisica', label: 'Pessoa física' },
          { id: 'juridica', label: 'Pessoa jurídica' },
        ]}
      />
      <TextField form={form} name="listagemF.empreendedor.cadastroProdutorRural" label="Cadastro de Produtor Rural – PR" />
      <CheckboxOptions
        form={form}
        name="listagemF.empreendedor.condicao"
        options={[
          { id: 'proprietario', label: 'Proprietário' },
          { id: 'arrendatario', label: 'Arrendatário' },
          { id: 'parceiro', label: 'Parceiro' },
          { id: 'posseiro', label: 'Posseiro' },
          { id: 'outros', label: 'Outros' },
        ]}
      />
      <TextField form={form} name="listagemF.empreendedor.cargoFuncao" label="Cargo / função" />
    </SectionCard>
  );
}
