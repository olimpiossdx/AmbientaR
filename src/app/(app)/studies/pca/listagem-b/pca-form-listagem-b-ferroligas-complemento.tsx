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
const base = 'listagemB.ferroligas';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const mesesAno = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const mineraisConsolidacao = [
  'Minério de ferro',
  'Quartzo',
  'Minério de manganês',
  'Minério de cromo',
  'Minério de níquel',
  'Minério de fósforo',
  'Minério de vanádio',
  'Minério de molibdênio',
  'Minério de zircônio',
  'Minério de titânio',
  'Minério de nióbio',
  'Outros minérios',
  'Calcário calcítico',
  'Dolomita',
  'Sucata de aço',
  'Carepa de aço',
  'Carvão vegetal',
  'Coque',
  'Lenha / cavaco / serragem',
  'Pasta de eletrodos',
  'Pasta refratária para revestimento de panelas',
  'Eletrodos de carbono pré-cozidos',
  'Alumínio (metálico, sucata)',
  'Magnésio (metálico, sucata)',
  'Cálcio-silício',
  'Ferro-ligas',
  'Escória rica',
  'Energia elétrica',
  'Gases (O₂, N₂)',
  'Gás GLP',
  'Gás natural',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

export function PcaFormListagemBFerroligasComplemento({ form }: { form: any }) {
  const possuiFornecedores = form.watch(`${base}.fornecedoresInternos.possui`);
  const usaMadeira = form.watch(`${base}.usoMadeira.utiliza`);
  const usaMinerioBruto = form.watch(`${base}.usoMinerioBruto.utiliza`);
  const usaRadioativo = form.watch(`${base}.insumoRadioativo.utiliza`);
  const usaResiduosConama = form.watch(`${base}.residuosConama023.utiliza`);
  const usaResiduosTerceiros = form.watch(`${base}.residuosTerceiros.utiliza`);
  const sazonalidade = form.watch(`${base}.regimeOperacao.sazonalidade`);

  const { fields: fornecedoresMadeira, append: appendMadeira, remove: removeMadeira } = useFieldArray({
    control: form.control,
    name: `${base}.usoMadeira.fornecedores`,
  });
  const { fields: fornecedoresMinerio, append: appendMinerio, remove: removeMinerio } = useFieldArray({
    control: form.control,
    name: `${base}.usoMinerioBruto.fornecedores`,
  });
  const { fields: residuosTerceiros, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: `${base}.residuosTerceiros.itens`,
  });
  const { fields: linhasMateriasPrimas, append: appendLinha, remove: removeLinha } = useFieldArray({
    control: form.control,
    name: `${base}.materiasPrimasConsolidacao.linhas`,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        A partir do item 23 inicia-se a caracterização técnica específica da atividade de produção de ligas
        ferrosas (ferro ligas) — TR Listagem B.
      </div>

      <PcaSectionCard title="24. Área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name={`${base}.areasEmpreendimento.areaTotalM2`} label="Área total do terreno (m²)" />
          <PcaNumField form={form} name={`${base}.areasEmpreendimento.areaUtilM2`} label="Área útil (m²)" />
          <PcaNumField form={form} name={`${base}.areasEmpreendimento.areaConstruidaM2`} label="Área construída (m²)" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="25. Recursos humanos">
        <FormDescription>
          Informar número de funcionários e percentual por cidade de origem (próprio município, outro MG, outros estados).
        </FormDescription>
        {['producao', 'administrativo', 'outrosSetores'].map((setor) => (
          <div key={setor} className="space-y-3 rounded-md border p-3">
            <p className="font-medium">
              {setor === 'producao' ? 'Setor de produção' : setor === 'administrativo' ? 'Setor administrativo' : 'Funcionários de outros setores'}
            </p>
            <PcaNumField form={form} name={`${base}.recursosHumanos.${setor}.numeroFuncionarios`} label="Nº de funcionários" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <PcaNumField form={form} name={`${base}.recursosHumanos.${setor}.percentProprioMunicipio`} label="% próprio município" />
              <PcaNumField form={form} name={`${base}.recursosHumanos.${setor}.percentOutroMg`} label="% outro município MG" />
              <PcaNumField form={form} name={`${base}.recursosHumanos.${setor}.percentOutrosEstados`} label="% outros estados" />
            </div>
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="26. Regime de operação do empreendimento">
        <FormDescription>Turnos administrativo e de operação (horários e pausas).</FormDescription>
        {['administrativo', 'operacaoTurno1', 'operacaoTurno2'].map((turno) => (
          <div key={turno} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <p className="font-medium md:col-span-4">
              {turno === 'administrativo' ? 'Administrativo' : turno === 'operacaoTurno1' ? 'Operação – Turno 1' : 'Operação – Turno 2'}
            </p>
            <PcaNumField form={form} name={`${base}.regimeOperacao.${turno}.funcionarios`} label="Nº funcionários/turno" />
            <PcaTextField form={form} name={`${base}.regimeOperacao.${turno}.horario`} label="Horário (início/fim)" />
            <PcaTextField form={form} name={`${base}.regimeOperacao.${turno}.pausa`} label="Pausa (início/fim)" />
          </div>
        ))}
        <PcaCheckboxOptions form={form} name={`${base}.regimeOperacao.diasOperacao`} options={diasSemana.map((d) => ({ id: d, label: d }))} />
        <PcaCheckboxOptions form={form} name={`${base}.regimeOperacao.mesesOperacao`} options={mesesAno.map((m) => ({ id: m, label: m }))} />
        <FormField
          control={form.control}
          name={`${base}.regimeOperacao.sazonalidade`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há sazonalidade na operação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {sazonalidade && (
          <>
            <FormField
              control={form.control}
              name={`${base}.regimeOperacao.sazonalidadePeriodo`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período do ano</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${base}.regimeOperacao.atividadesParadas`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atividades que param e duração</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${base}.regimeOperacao.atividadesReduzidas`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atividades reduzidas e duração</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="27. Fornecedores com instalações dentro do empreendimento">
        <FormField
          control={form.control}
          name={`${base}.fornecedoresInternos.possui`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Há fornecedores cujas instalações estejam dentro do empreendimento?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {possuiFornecedores && (
          <>
            <PcaNumField form={form} name={`${base}.fornecedoresInternos.quantidadeEmpresas`} label="Quantas empresas?" />
            <FormField
              control={form.control}
              name={`${base}.fornecedoresInternos.descricaoAtividades`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição das atividades de cada empresa</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="28. Uso de madeira">
        <FormField
          control={form.control}
          name={`${base}.usoMadeira.utiliza`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>A atividade consome carvão vegetal ou madeira?</FormLabel>
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
              name={`${base}.usoMadeira.possuiCadastroIef`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Possui ou solicitou cadastro junto à IEF?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {fornecedoresMadeira.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
                <PcaTextField form={form} name={`${base}.usoMadeira.fornecedores.${index}.material`} label="Material utilizado" />
                <PcaTextField form={form} name={`${base}.usoMadeira.fornecedores.${index}.razaoSocial`} label="Razão social" />
                <PcaTextField form={form} name={`${base}.usoMadeira.fornecedores.${index}.cnpjCpf`} label="CNPJ/CPF" />
                <PcaTextField form={form} name={`${base}.usoMadeira.fornecedores.${index}.endereco`} label="Endereço" />
                <FormField
                  control={form.control}
                  name={`${base}.usoMadeira.fornecedores.${index}.possuiLicenca`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor com LO?</FormLabel>
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
            <Button type="button" variant="outline" onClick={() => appendMadeira({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar fornecedor de madeira
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="29. Uso de minério em estado bruto">
        <FormDescription>Tabela de minérios utilizados e fornecedores.</FormDescription>
        <FormField
          control={form.control}
          name={`${base}.usoMinerioBruto.utiliza`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há utilização de minério em estado bruto?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaMinerioBruto && (
          <>
            {fornecedoresMinerio.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
                <PcaTextField form={form} name={`${base}.usoMinerioBruto.fornecedores.${index}.minerio`} label="Minério utilizado" />
                <PcaTextField form={form} name={`${base}.usoMinerioBruto.fornecedores.${index}.razaoSocial`} label="Razão social" />
                <PcaTextField form={form} name={`${base}.usoMinerioBruto.fornecedores.${index}.cnpj`} label="CNPJ" />
                <PcaTextField form={form} name={`${base}.usoMinerioBruto.fornecedores.${index}.endereco`} label="Endereço" />
                <FormField
                  control={form.control}
                  name={`${base}.usoMinerioBruto.fornecedores.${index}.possuiLicenca`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor com LO?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="md:col-span-5 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeMinerio(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendMinerio({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar fornecedor de minério
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="30. Uso de insumo radioativo">
        <FormField
          control={form.control}
          name={`${base}.insumoRadioativo.utiliza`}
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
            <PcaTextField form={form} name={`${base}.insumoRadioativo.quaisInsumos`} label="Quais insumos?" />
            <FormField
              control={form.control}
              name={`${base}.insumoRadioativo.comoQuantidades`}
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
              name={`${base}.insumoRadioativo.concentracoes`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concentrações de atividade (total e beta total)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="31. Uso de resíduos – Resolução CONAMA nº 023/1996">
        <FormField
          control={form.control}
          name={`${base}.residuosConama023.utiliza`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há utilização de resíduos importados listados na CONAMA 023/1996?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaResiduosConama && (
          <>
            <PcaTextField form={form} name={`${base}.residuosConama023.nomesCodigos`} label="Resíduos (nomes e códigos)" />
            <FormField
              control={form.control}
              name={`${base}.residuosConama023.comoQuantidade`}
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
      </PcaSectionCard>

      <PcaSectionCard title="32. Uso de resíduos gerados por terceiros dentro do país">
        <FormField
          control={form.control}
          name={`${base}.residuosTerceiros.utiliza`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há utilização de resíduos de terceiros?</FormLabel>
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
                <PcaTextField form={form} name={`${base}.residuosTerceiros.itens.${index}.nomeResiduo`} label="Nome do resíduo" />
                <PcaTextField form={form} name={`${base}.residuosTerceiros.itens.${index}.razaoSocial`} label="Razão social" />
                <PcaTextField form={form} name={`${base}.residuosTerceiros.itens.${index}.cnpj`} label="CNPJ" />
                <PcaTextField form={form} name={`${base}.residuosTerceiros.itens.${index}.endereco`} label="Endereço" />
                <FormField
                  control={form.control}
                  name={`${base}.residuosTerceiros.itens.${index}.possuiLicenca`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor com LO?</FormLabel>
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
            <Button type="button" variant="outline" onClick={() => appendResiduo({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar resíduo de terceiro
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="33. Consolidação de matérias-primas e materiais intermediários">
        <FormDescription>
          Legenda embalagem (*): 1–12 conforme TR. Armazenamento (**): I–VIII. Marque principais/intermediários e consumo mensal.
        </FormDescription>
        {mineraisConsolidacao.map((item) => {
          const slug = slugify(item);
          return (
            <div key={slug} className="space-y-3 rounded-md border p-3">
              <p className="font-medium">{item}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <PcaCheckboxOptions
                  form={form}
                  name={`${base}.materiasPrimasConsolidacao.itens.${slug}.aplicacao`}
                  options={[
                    { id: 'principal', label: 'Principal' },
                    { id: 'intermediario', label: 'Intermediário' },
                  ]}
                />
                <PcaTextField form={form} name={`${base}.materiasPrimasConsolidacao.itens.${slug}.estadoFisico`} label="Estado físico" />
                <PcaTextField form={form} name={`${base}.materiasPrimasConsolidacao.itens.${slug}.embalagem`} label="Código embalagem (*)" />
                <PcaTextField form={form} name={`${base}.materiasPrimasConsolidacao.itens.${slug}.armazenamento`} label="Código armazenamento (**)" />
                <PcaNumField form={form} name={`${base}.materiasPrimasConsolidacao.itens.${slug}.consumoMaximo`} label="Consumo mensal máximo" />
                <PcaNumField form={form} name={`${base}.materiasPrimasConsolidacao.itens.${slug}.consumoMedio`} label="Consumo mensal médio" />
                <PcaTextField form={form} name={`${base}.materiasPrimasConsolidacao.itens.${slug}.unidade`} label="Unidade" />
              </div>
            </div>
          );
        })}
        {linhasMateriasPrimas.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <PcaTextField form={form} name={`${base}.materiasPrimasConsolidacao.linhas.${index}.descricao`} label="Outro insumo" className="md:col-span-2" />
            <PcaNumField form={form} name={`${base}.materiasPrimasConsolidacao.linhas.${index}.consumoMaximo`} label="Consumo máximo" />
            <PcaNumField form={form} name={`${base}.materiasPrimasConsolidacao.linhas.${index}.consumoMedio`} label="Consumo médio" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeLinha(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendLinha({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar outro insumo
        </Button>
      </PcaSectionCard>
    </div>
  );
}
