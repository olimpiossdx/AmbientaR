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
const combustiveisFixos = [
  { id: 'bagaco', label: 'Bagaço de cana' },
  { id: 'oleo_combustivel', label: 'Óleo combustível (especificar tipo)' },
  { id: 'lenha', label: 'Lenha' },
  { id: 'carvao_vegetal', label: 'Carvão vegetal' },
  { id: 'energia_eletrica', label: 'Energia elétrica' },
  { id: 'biodiesel', label: 'Biodiesel' },
  { id: 'outros', label: 'Outros (especificar)' },
];

const locaisEmergencia = [
  { id: 'producao', label: 'Área de produção' },
  { id: 'armazenamento', label: 'Área de armazenamento de produtos e insumos' },
  { id: 'tratamento_efluentes', label: 'Área de tratamento de efluentes' },
  { id: 'tratamento', label: 'Área de tratamento' },
  { id: 'residuos', label: 'Área de armazenamento e/ou disposição de resíduos' },
];

const eventosEmergencia = [
  { id: 'incendio', label: 'Incêndio' },
  { id: 'explosao', label: 'Explosão' },
  { id: 'gas', label: 'Liberação acidental de gás' },
  { id: 'vapor', label: 'Liberação acidental de vapor' },
  { id: 'particulado', label: 'Liberação acidental de material particulado' },
  { id: 'vazamento_produto', label: 'Derramamento/vazamento de produtos' },
  { id: 'vazamento_insumo', label: 'Derramamento/vazamento de insumos' },
];

const parametrosEfluenteSanitario = [
  'Número de contribuintes',
  'Vazão máxima',
  'Vazão média',
  'Vazão mínima',
  'Tempo de operação',
  'Carga orgânica (kg DBO/dia)',
  'DBO',
  'DQO',
  'pH',
  'Sólidos sedimentáveis',
  'Substâncias tensoativas',
  'Eficiência total do sistema',
];

const parametrosEfluenteIndustrial = [
  'DBO',
  'DQO',
  'Sólidos suspensos',
  'Sólidos sedimentáveis',
  'Óleos e graxas',
  'pH',
  'Cobre',
  'Potássio',
  'Nitrogênio',
];

const efluentesIndustriaisVazao = [
  { id: 'vinhoto', label: 'Vinhoto', unidade: 'L/L de cachaça' },
  { id: 'cabeca', label: 'Cachaça de cabeça', unidade: 'L/L de cachaça' },
  { id: 'cauda', label: 'Cachaça de cauda', unidade: 'L/L de cachaça' },
  { id: 'lavagem_equip', label: 'Lavagem de equipamento', unidade: 'L/L de cachaça' },
  { id: 'lavagem_cana', label: 'Lavagem de cana', unidade: 'L/kg de cana' },
  { id: 'lavagem_garrafas', label: 'Lavagem de garrafas', unidade: 'mL/garrafa' },
  { id: 'descarga_caldeira', label: 'Descarga de caldeira', unidade: '' },
];

function LancamentoEfluente({ form, basePath }: { form: any; basePath: string }) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <PcaCheckboxOptions
        form={form}
        name={`${basePath}.tipos`}
        options={[
          { id: 'rios', label: "Rios, córregos, etc." },
          { id: 'lagos', label: 'Lagos, represas, etc.' },
          { id: 'rede_publica', label: 'Rede pública' },
          { id: 'solo', label: 'Solo' },
          { id: 'outras', label: 'Outras (especificar)' },
        ]}
      />
      <PcaTextField form={form} name={`${basePath}.nomeLocal`} label="Nome / especificação do local" />
      <PcaNumField form={form} name={`${basePath}.pontosLancamento`} label="Nº de pontos de lançamento" />
    </div>
  );
}

export function PcaFormListagemDModulo5({ form }: { form: any }) {
  const fase = form.watch('listagemD.regularizacaoAmbiental.fase');
  const isLoc = fase === 'LOC' || fase === 'LO';

  const { fields: energiaEletrica, append: appendEletrica, remove: removeEletrica } = useFieldArray({
    control: form.control,
    name: 'listagemD.insumos.energiaEletrica.linhas',
  });
  const { fields: impactosInst, append: appendImpacto, remove: removeImpacto } = useFieldArray({
    control: form.control,
    name: 'listagemD.impactos.instalacao.linhas',
  });
  const { fields: fontesEmissao, append: appendFonte, remove: removeFonte } = useFieldArray({
    control: form.control,
    name: 'listagemD.emissoes.fontes',
  });
  const { fields: residuos, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: 'listagemD.residuos.linhas',
  });
  const { fields: medicoesRuido, append: appendRuido, remove: removeRuido } = useFieldArray({
    control: form.control,
    name: 'listagemD.ruidos.medicoes',
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="26 (cont.) – Energia elétrica e térmica">
        <p className="text-sm font-medium">Energia elétrica</p>
        {energiaEletrica.map((item, index) => (
          <div key={item.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`listagemD.insumos.energiaEletrica.linhas.${index}.concessionaria`} label="Concessionária" />
            <PcaNumField form={form} name={`listagemD.insumos.energiaEletrica.linhas.${index}.demandaKwh`} label="Demanda contratada (kWh)" />
            <PcaNumField form={form} name={`listagemD.insumos.energiaEletrica.linhas.${index}.consumoMedio`} label="Consumo médio (kWh/mês)" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeEletrica(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendEletrica({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar concessionária
        </Button>

        <p className="mt-4 text-sm font-medium">Caldeiras / aquecedores / fornos</p>
        {['caldeiras', 'aquecedores', 'fornos', 'fornalhas', 'outros'].map((tipo) => (
          <PcaTextField
            key={tipo}
            form={form}
            name={`listagemD.insumos.energiaTermica.${tipo}.resumo`}
            label={`${tipo} – resumo (anexo detalhado)`}
          />
        ))}

        <p className="mt-4 text-sm font-medium">Combustíveis – fontes fixas</p>
        {combustiveisFixos.map((c) => (
          <div key={c.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-4">
            <FormField
              control={form.control}
              name={`listagemD.insumos.combustiveis.${c.id}.utiliza`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 md:col-span-4">
                  <FormControl><Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">{c.label}</FormLabel>
                </FormItem>
              )}
            />
            <PcaNumField form={form} name={`listagemD.insumos.combustiveis.${c.id}.consumoMaxTd`} label="Consumo máx. (t/dia)" />
            <PcaNumField form={form} name={`listagemD.insumos.combustiveis.${c.id}.consumoMedioTd`} label="Consumo médio (t/dia)" />
            <PcaTextField form={form} name={`listagemD.insumos.combustiveis.${c.id}.fornecedor`} label="Fornecedor" />
            <PcaTextField form={form} name={`listagemD.insumos.combustiveis.${c.id}.cnpjCpf`} label="CNPJ/CPF" />
          </div>
        ))}

        <FormDescription className="mt-4">Sistemas de resfriamento – detalhar em anexo ou campo resumo.</FormDescription>
        <FormField
          control={form.control}
          name="listagemD.insumos.resfriamento.resumo"
          render={({ field }) => (
            <FormItem>
              <FormControl><Textarea placeholder="Nome, fabricante, fluido refrigerante, capacidade..." {...field} /></FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="Módulo 5 – Possíveis impactos ambientais">
        <FormDescription>Itens 27 a 39 do termo de referência RCA – aguardente.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="27. Agentes causadores de impactos – fase de instalação">
        {impactosInst.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`listagemD.impactos.instalacao.linhas.${index}.acao`} label="Ação ou agente impactante" />
            <PcaTextField form={form} name={`listagemD.impactos.instalacao.linhas.${index}.impacto`} label="Impacto associado" />
            <PcaTextField form={form} name={`listagemD.impactos.instalacao.linhas.${index}.medidas`} label="Medidas mitigadoras" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeImpacto(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendImpacto({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar linha
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="28. Efluentes sanitários">
        <FormField
          control={form.control}
          name="listagemD.efluentesSanitarios.possuiTratamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui sistema de tratamento de efluentes sanitários?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemD.efluentesSanitarios.tratadoComIndustrial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tratado juntamente com o efluente industrial?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <PcaTextField
          form={form}
          name="listagemD.efluentesSanitarios.estruturaMistura"
          label="Estrutura de mistura com efluente industrial"
        />
        <PcaNumField
          form={form}
          name="listagemD.efluentesSanitarios.taxaMaximaM3Dia"
          label="Taxa máxima de geração (m³/dia)"
        />
        <LancamentoEfluente form={form} basePath="listagemD.efluentesSanitarios.lancamento" />
      </PcaSectionCard>

      <PcaSectionCard title="29. Características do efluente sanitário">
        <CaracterizacaoEfluenteAntesDepois
          form={form}
          basePath="listagemD.efluentesSanitarios.caracterizacao"
          parametrosAntes={parametrosEfluenteSanitario}
          parametrosDepois={parametrosEfluenteSanitario}
        />
      </PcaSectionCard>

      <PcaSectionCard title="30. Efluentes líquidos industriais">
        {efluentesIndustriaisVazao.map((ef) => (
          <div key={ef.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-4">
            <p className="text-sm md:col-span-2">{ef.label} ({ef.unidade})</p>
            <PcaNumField form={form} name={`listagemD.efluentesIndustriais.vazoes.${ef.id}.maxima`} label="Vazão máxima" />
            <PcaNumField form={form} name={`listagemD.efluentesIndustriais.vazoes.${ef.id}.media`} label="Vazão média" />
          </div>
        ))}
        <LancamentoEfluente form={form} basePath="listagemD.efluentesIndustriais.lancamento" />
        <FormField
          control={form.control}
          name="listagemD.efluentesIndustriais.possuiTratamento"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Existe sistema de tratamento em funcionamento?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <PcaTextField form={form} name="listagemD.efluentesIndustriais.dataEntrada" label="Data de entrada em funcionamento" />
        <PcaTextField form={form} name="listagemD.efluentesIndustriais.capacidadeDimensionada" label="Capacidade dimensionada" />
        <CaracterizacaoEfluenteAntesDepois
          form={form}
          basePath="listagemD.efluentesIndustriais.caracterizacao"
          parametrosAntes={parametrosEfluenteIndustrial}
          parametrosDepois={parametrosEfluenteIndustrial}
        />
      </PcaSectionCard>

      <PcaSectionCard title="31. Emissões atmosféricas">
        <PcaNumField
          form={form}
          name="listagemD.emissoes.capacidadeVaporKgH"
          label="Capacidade nominal total de geração de vapor (kg/h)"
        />
        <FormField
          control={form.control}
          name="listagemD.emissoes.porteRural"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Porte (zona rural): maior ou menor que 2.000 kg/h?</FormLabel>
              <FormControl>
                <Input placeholder="maior_2000 / menor_2000" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {fontesEmissao.map((item, index) => (
          <div key={item.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`listagemD.emissoes.fontes.${index}.fonte`} label="Fonte" />
            <PcaTextField form={form} name={`listagemD.emissoes.fontes.${index}.combustivel`} label="Combustível" />
            <PcaTextField form={form} name={`listagemD.emissoes.fontes.${index}.alturaChamine`} label="Altura chaminé/duto (m)" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeFonte(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendFonte({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar fonte
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="32. Resíduos sólidos industriais">
        {residuos.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`listagemD.residuos.linhas.${index}.nome`} label="Nome do resíduo" />
            <PcaTextField form={form} name={`listagemD.residuos.linhas.${index}.pontoGeracao`} label="Ponto de geração" />
            <PcaTextField form={form} name={`listagemD.residuos.linhas.${index}.classificacao`} label="Classificação NBR 10.004" />
            <PcaNumField form={form} name={`listagemD.residuos.linhas.${index}.geradaKgMes`} label="Gerada (kg/mês)" />
            <PcaNumField form={form} name={`listagemD.residuos.linhas.${index}.estocadaKg`} label="Estocada (kg)" />
            <PcaTextField form={form} name={`listagemD.residuos.linhas.${index}.formaDisposicao`} label="Forma disposição (1-16)" />
            <PcaTextField form={form} name={`listagemD.residuos.linhas.${index}.localDisposicao`} label="Local (D/F)" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeResiduo(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendResiduo({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar resíduo
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="33. Compostagem">
        <FormDescription>Preencher somente se houver compostagem no empreendimento.</FormDescription>
        <FormField
          control={form.control}
          name="listagemD.compostagem.caracteristicas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Características do pátio</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="34. Landfarming">
        <FormField
          control={form.control}
          name="listagemD.landfarming.descricao"
          render={({ field }) => (
            <FormItem>
              <FormControl><Textarea placeholder="Local de tratamento no solo..." {...field} /></FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="35. Incineração">
        <FormField
          control={form.control}
          name="listagemD.incineracao.descricao"
          render={({ field }) => (
            <FormItem>
              <FormControl><Textarea placeholder="Instalações de incineração/queima..." {...field} /></FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="36. Outras formas de destinação">
        <FormField
          control={form.control}
          name="listagemD.outrasDestinacaoResiduos.descricao"
          render={({ field }) => (
            <FormItem>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="37. Ruídos">
        <FormField
          control={form.control}
          name="listagemD.ruidos.municipioTemLegislacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Município tem legislação específica sobre ruído?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        {isLoc && (
          <>
            <FormDescription>Avaliação do ruído ambiental (somente LO corretiva).</FormDescription>
            {medicoesRuido.map((item, index) => (
              <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
                <PcaTextField form={form} name={`listagemD.ruidos.medicoes.${index}.ponto`} label="Ponto / fonte" />
                <PcaTextField form={form} name={`listagemD.ruidos.medicoes.${index}.data`} label="Data" />
                <PcaTextField form={form} name={`listagemD.ruidos.medicoes.${index}.hora`} label="Hora" />
                <PcaNumField form={form} name={`listagemD.ruidos.medicoes.${index}.maxDb`} label="Máx. dB(A)" />
                <PcaNumField form={form} name={`listagemD.ruidos.medicoes.${index}.minDb`} label="Mín. dB(A)" />
                <PcaNumField form={form} name={`listagemD.ruidos.medicoes.${index}.medioDb`} label="Médio dB(A)" />
                <PcaTextField form={form} name={`listagemD.ruidos.medicoes.${index}.limiteLegal`} label="Limite legal" />
                <Button type="button" variant="outline" size="sm" onClick={() => removeRuido(index)}>
                  <Trash2 className="mr-2 h-4 w-4" />Remover
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendRuido({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar medição
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="38. Situações de emergência">
        {locaisEmergencia.map((local) => (
          <div key={local.id} className="mb-4 rounded-md border p-3">
            <p className="mb-2 font-medium">{local.label}</p>
            <PcaCheckboxOptions
              form={form}
              name={`listagemD.emergencia.${local.id}.eventos`}
              options={eventosEmergencia}
            />
          </div>
        ))}
        {isLoc && (
          <>
            <FormField
              control={form.control}
              name="listagemD.emergencia.prevencaoImplementada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimentos de prevenção implementados? (LO corretiva)</FormLabel>
                  <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="listagemD.emergencia.procedimentosEmergencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimentos de emergência descritos e divulgados?</FormLabel>
                  <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="39. Passivos ambientais">
        <FormDescription>Apresentar em anexo declaração da existência ou não de passivos ambientais.</FormDescription>
        <FormField
          control={form.control}
          name="listagemD.passivosAmbientais.observacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referência / observações</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>
    </div>
  );
}
