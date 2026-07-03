'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const setoresMateriasPrimas = [
  'Modelagem',
  'Macharia',
  'Moldagem',
  'Fusão',
  'Tratamento térmico',
  'Acabamento',
  'Pintura',
  'Usinagem',
  'Tratamento químico superficial',
  'Laboratório',
  'Qualidade / Inspeção das peças fundidas',
];

export function FormListagemBFundidosComplemento({ form }: { form: any }) {
  const possuiFornecedores = form.watch('listagemB.fornecedoresInternos.possui');
  const usaMadeira = form.watch('listagemB.usoMadeira.utiliza');
  const usaRadioativo = form.watch('listagemB.insumoRadioativo.utiliza');
  const usaResiduosConama = form.watch('listagemB.residuosConama023.utiliza');
  const usaResiduosTerceiros = form.watch('listagemB.residuosTerceiros.utiliza');

  const { fields: fornecedoresMadeira, append: appendMadeira, remove: removeMadeira } = useFieldArray({
    control: form.control,
    name: 'listagemB.usoMadeira.fornecedores',
  });
  const { fields: residuosTerceiros, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: 'listagemB.residuosTerceiros.itens',
  });
  const { fields: linhasMateriasPrimas, append: appendLinha, remove: removeLinha } = useFieldArray({
    control: form.control,
    name: 'listagemB.materiasPrimasConsolidacao.linhas',
  });

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        A partir do item 23 inicia-se a caracterização técnica específica da atividade de fundição (TR Listagem B).
      </div>

      <SectionCard title="24. Área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemB.areasEmpreendimento.areaTotalM2" label="Área total do terreno (m²)" />
          <NumField form={form} name="listagemB.areasEmpreendimento.areaUtilM2" label="Área útil (m²)" />
          <NumField form={form} name="listagemB.areasEmpreendimento.areaConstruidaM2" label="Área construída (m²)" />
        </div>
      </SectionCard>

      <SectionCard title="27. Fornecedores com instalações dentro do empreendimento">
        <FormField
          control={form.control}
          name="listagemB.fornecedoresInternos.possui"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Há fornecedores de produtos ou serviços cujas instalações estejam dentro do empreendimento?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {possuiFornecedores && (
          <NumField form={form} name="listagemB.fornecedoresInternos.quantidadeEmpresas" label="Quantas empresas há nestas condições?" />
        )}
        <FormDescription>
          Empresas instaladas no empreendimento devem descrever suas atividades e obter licenciamento ambiental próprio.
        </FormDescription>
      </SectionCard>

      <SectionCard title="28. Uso de madeira">
        <FormField
          control={form.control}
          name="listagemB.usoMadeira.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                A atividade envolve consumo de lenha, madeira ou derivados como matéria-prima, intermediária ou combustível?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaMadeira && (
          <>
            <FormField
              control={form.control}
              name="listagemB.usoMadeira.possuiCadastroIef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Possui ou solicitou Cadastro de Utilização de Madeira junto à IEF?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {fornecedoresMadeira.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
                <TextField form={form} name={`listagemB.usoMadeira.fornecedores.${index}.material`} label="Material utilizado" />
                <TextField form={form} name={`listagemB.usoMadeira.fornecedores.${index}.razaoSocial`} label="Razão social do fornecedor" />
                <TextField form={form} name={`listagemB.usoMadeira.fornecedores.${index}.cnpjCpf`} label="CNPJ/CPF" />
                <TextField form={form} name={`listagemB.usoMadeira.fornecedores.${index}.endereco`} label="Endereço" />
                <FormField
                  control={form.control}
                  name={`listagemB.usoMadeira.fornecedores.${index}.possuiLicenca`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor com LO ou equivalente?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="md:col-span-5 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeMadeira(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendMadeira({ material: '', razaoSocial: '', cnpjCpf: '', endereco: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar fornecedor de madeira
            </Button>
          </>
        )}
      </SectionCard>

      <SectionCard title="29. Uso de insumo radioativo">
        <FormField
          control={form.control}
          name="listagemB.insumoRadioativo.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há utilização de insumo radioativo?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaRadioativo && (
          <>
            <TextField form={form} name="listagemB.insumoRadioativo.quaisInsumos" label="Quais são esses insumos?" />
            <FormField
              control={form.control}
              name="listagemB.insumoRadioativo.comoQuantidades"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Como e em que quantidades são utilizados?</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="listagemB.insumoRadioativo.concentracoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concentrações de atividades (total e específica)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="30. Uso de resíduos listados na Resolução CONAMA nº 023/1996">
        <FormField
          control={form.control}
          name="listagemB.residuosConama023.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há utilização de resíduos da Resolução CONAMA 023/1996?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaResiduosConama && (
          <>
            <TextField form={form} name="listagemB.residuosConama023.nomesCodigos" label="Resíduos (nomes e códigos)" />
            <FormField
              control={form.control}
              name="listagemB.residuosConama023.comoQuantidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Como e em que quantidade é utilizado?</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="31. Uso de resíduos gerados por terceiros dentro do país">
        <FormField
          control={form.control}
          name="listagemB.residuosTerceiros.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há utilização de resíduos gerados por terceiros?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaResiduosTerceiros && (
          <>
            {residuosTerceiros.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
                <TextField form={form} name={`listagemB.residuosTerceiros.itens.${index}.nomeResiduo`} label="Nome do resíduo" />
                <TextField form={form} name={`listagemB.residuosTerceiros.itens.${index}.razaoSocial`} label="Razão social do fornecedor" />
                <TextField form={form} name={`listagemB.residuosTerceiros.itens.${index}.cnpj`} label="CNPJ" />
                <TextField form={form} name={`listagemB.residuosTerceiros.itens.${index}.endereco`} label="Endereço" />
                <FormField
                  control={form.control}
                  name={`listagemB.residuosTerceiros.itens.${index}.possuiLicenca`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor com LO ou equivalente?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="md:col-span-5 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeResiduo(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendResiduo({ nomeResiduo: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar resíduo de terceiro
            </Button>
          </>
        )}
      </SectionCard>

      <SectionCard title="32. Consolidação de matérias-primas e materiais intermediários">
        <FormDescription>
          Consolidar matérias-principais e intermediárias por setor (itens 28 a 31 e demais insumos). Incluir bloco específico para cada metal não ferroso produzido, se houver.
        </FormDescription>
        {setoresMateriasPrimas.map((setor) => {
          const slug = setor.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="space-y-3 rounded-md border p-3">
              <p className="font-medium">{setor}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <TextField form={form} name={`listagemB.materiasPrimasConsolidacao.setores.${slug}.descricao`} label="Matéria-prima / insumo" />
                <TextField form={form} name={`listagemB.materiasPrimasConsolidacao.setores.${slug}.estadoFisico`} label="Estado físico" />
                <TextField form={form} name={`listagemB.materiasPrimasConsolidacao.setores.${slug}.embalagem`} label="Código embalagem (*)" />
                <TextField form={form} name={`listagemB.materiasPrimasConsolidacao.setores.${slug}.armazenamento`} label="Código armazenamento (**)" />
                <NumField form={form} name={`listagemB.materiasPrimasConsolidacao.setores.${slug}.consumoMaximo`} label="Consumo mensal máximo" />
                <NumField form={form} name={`listagemB.materiasPrimasConsolidacao.setores.${slug}.consumoMedio`} label="Consumo mensal médio" />
              </div>
            </div>
          );
        })}
        {linhasMateriasPrimas.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemB.materiasPrimasConsolidacao.linhas.${index}.setor`} label="Setor (outros)" />
            <TextField form={form} name={`listagemB.materiasPrimasConsolidacao.linhas.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <NumField form={form} name={`listagemB.materiasPrimasConsolidacao.linhas.${index}.consumoMensal`} label="Consumo mensal" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeLinha(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendLinha({ setor: '', descricao: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar linha de matéria-prima
        </Button>
      </SectionCard>
    </div>
  );
}
