'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CheckboxOptions,
  NumField,
  SectionCard,
  TextField,
} from './form-listagem-a-helpers';

export type FormListagemATecnicoParte = 'completo' | '27-36' | '37-53' | '57-59';

interface FormListagemATecnicoProps {
  form: any;
  /** Permite reutilizar blocos do TR em fichas específicas (ex.: lavra subterrânea). */
  parte?: FormListagemATecnicoParte;
}

function incluiParte(parte: FormListagemATecnicoParte, bloco: FormListagemATecnicoParte): boolean {
  if (parte === 'completo') return true;
  return parte === bloco;
}

const etapasTratamentoAgua = [
  { id: 'coagulacao', label: 'Coagulação' },
  { id: 'floculacao', label: 'Floculação' },
  { id: 'decantacao', label: 'Decantação' },
  { id: 'sedimentacao', label: 'Sedimentação' },
  { id: 'filtracao_lenta', label: 'Filtração lenta' },
  { id: 'filtracao_rapida', label: 'Filtração rápida' },
  { id: 'correcao_ph', label: 'Correção de pH' },
  { id: 'desinfecao_cloro', label: 'Desinfecção – adição de cloro' },
  { id: 'desinfecao_ozonio', label: 'Desinfecção – adição de ozônio' },
  { id: 'desinfecao_carvao', label: 'Desinfecção – carvão ativado' },
  { id: 'retrolavagem', label: 'Retrolavagem' },
  { id: 'outros', label: 'Outros' },
];

const finalidadesAgua = [
  'Consumo uso doméstico',
  'Consumo uso industrial',
  'Lavagem de veículos',
  'Oficinas',
  'Equipamentos perfuração',
  'Lavagem de minério',
  'Moagem a úmido',
  'Uso no processo de beneficiamento',
  'Utilidades (limpeza de pisos e equipamentos, etc.)',
  'Uso não industrial',
  'Geração de vapor',
  'Reposição de perdas/evaporação',
  'Testes hidrostáticos',
  'Sistema de controle de emissões atmosféricas',
  'Consumo humano (sanitários, refeitório etc.)',
  'Outras finalidades',
];

const tiposResiduosSolidos = [
  'Óleo usado',
  'Contaminados com óleo em geral',
  'Resíduo ambulatorial',
  'Baterias usadas de veículos',
  'Pilhas e baterias pequenas',
  'Lâmpadas queimadas',
  'Latas de tintas comuns, spray e solventes',
  'Pneus',
  'Borracha, exceto pneus',
  'Sucata metálica',
  'Papel e papelão',
  'Plástico',
  'Vidro',
  'Madeira',
  'Orgânico – resto de alimentos',
  'Resíduos de construção civil',
  'EPI usado',
  'Rejeito gerado no processo',
  'Outros',
];

const parametrosEfluenteBruto = [
  { parametro: 'pH', unidade: '-' },
  { parametro: 'Condutividade elétrica', unidade: 'uS/cm' },
  { parametro: 'Temperatura', unidade: '°C' },
  { parametro: 'Materiais sedimentáveis', unidade: 'mg/L' },
  { parametro: 'Sólidos em suspensão', unidade: 'mg/L' },
  { parametro: 'Óleos e graxas – minerais', unidade: 'mg/L' },
  { parametro: 'Óleos e graxas – vegetal/animal', unidade: 'mg/L' },
  { parametro: 'DBO', unidade: 'mg/L' },
  { parametro: 'DQO', unidade: 'mg/L' },
  { parametro: 'Substâncias tensoativas (LAS)', unidade: 'mg/L LAS' },
  { parametro: 'N-nitrato', unidade: 'mg/L' },
  { parametro: 'N-nitrito', unidade: 'mg/L' },
  { parametro: 'N-amoniacal', unidade: 'mg/L' },
  { parametro: 'Alumínio solúvel', unidade: 'mg/L' },
  { parametro: 'Arsênio solúvel', unidade: 'mg/L' },
  { parametro: 'Cobre solúvel', unidade: 'mg/L' },
  { parametro: 'Ferro solúvel', unidade: 'mg/L' },
  { parametro: 'Manganês solúvel', unidade: 'mg/L' },
  { parametro: 'Níquel solúvel', unidade: 'mg/L' },
  { parametro: 'Zinco solúvel', unidade: 'mg/L' },
];

const parametrosAguaSubterranea = [
  'Nível de água (m)',
  'Velocidade de recarga do aquífero (mL/s)',
  'Turbidez (NTU)',
  'pH',
  'Condutividade elétrica (uS/cm)',
  'Alumínio solúvel (mg/L)',
  'Arsênio solúvel (mg/L)',
  'Cobre solúvel (mg/L)',
  'Ferro solúvel (mg/L)',
  'Manganês solúvel (mg/L)',
  'Níquel solúvel (mg/L)',
  'Zinco solúvel (mg/L)',
  'Sólidos totais dissolvidos (mg/L)',
  'Nitrogênio amoniacal (mg/L)',
  'Nitrogênio nítrico (mg/L)',
  'DBO (mg/L)',
  'DQO (mg/L)',
];

const parametrosAguaSuperficial = [
  'pH',
  'Condutividade elétrica (uS/cm)',
  'Alumínio solúvel (mg/L)',
  'Arsênio total (mg/L)',
  'Cobre solúvel (mg/L)',
  'Ferro solúvel (mg/L)',
  'Manganês total (mg/L)',
  'Níquel solúvel (mg/L)',
  'Zinco solúvel (mg/L)',
  'Sólidos totais dissolvidos (mg/L)',
  'Nitrogênio amoniacal (mg/L)',
  'Nitrogênio nítrico (mg/L)',
  'Turbidez (NTU)',
  'DBO (mg/L)',
  'DQO (mg/L)',
];

const fontesEmissaoAtmosferica = [
  {
    id: 'frente_lavra',
    label: 'Frente de lavra – desmonte de rochas',
    emissoes: ['Material particulado', 'Gases da detonação', 'Outros'],
    medidas: [
      'Aspersão de água para abatimento da poeira',
      'Aspersão de água para absorção dos gases gerados na detonação',
      'Existência de sistema de ventilação eficaz',
      'Outros',
    ],
  },
  {
    id: 'trafego_veiculos_mina',
    label: 'Tráfego de veículos dentro da mina',
    emissoes: ['Gases veiculares', 'Material particulado', 'Outros'],
    medidas: [
      'Aspersão de água via caminhão pipa',
      'Pavimentação das vias internas da mina',
      'Manutenção periódica nos veículos',
      'Monitoramento das emissões veiculares',
      'Existência de sistema de ventilação eficaz',
      'Outros',
    ],
  },
  {
    id: 'ventilacao_mina',
    label: 'Sistema de ventilação da mina',
    emissoes: ['Material particulado e gases no interior da mina', 'Fuligem', 'Outras'],
    medidas: [
      'Monitoramento das emissões veiculares',
      'Monitoramento das emissões do sistema de ventilação',
      'Monitoramento da qualidade do ar no entorno da mina',
      'Outras',
    ],
  },
  {
    id: 'britagem',
    label: 'Operações de britagem',
    emissoes: ['Material particulado', 'Outras'],
    medidas: [
      'Aspersores fixos de água sobre a britagem',
      'Sistema de britagem enclausurado',
      'Filtro de mangas',
      'Outras',
    ],
  },
  {
    id: 'moagem',
    label: 'Operações de moagem',
    emissoes: ['Particulados', 'Outras'],
    medidas: ['Moagem a úmido', 'Moagem em sistema totalmente fechado', 'Outras'],
  },
  {
    id: 'filtragem_secagem',
    label: 'Filtragem e secagem',
    emissoes: ['Particulado', 'Outras'],
    medidas: [
      'Equipamentos em ambiente fechado com despoeiramento',
      'Aspersão de água no ambiente',
      'Outras',
    ],
  },
  {
    id: 'trafego_externo',
    label: 'Tráfego intenso de equipamentos pesados no exterior da mina',
    emissoes: ['Material particulado', 'Emissões veiculares', 'Outras'],
    medidas: [
      'Aspersão de água via caminhão pipa',
      'Aspersores fixos ao longo das estradas',
      'Pavimentação das vias',
      'Monitoramento das emissões dos veículos',
      'Monitoramento da qualidade do ar na área externa',
      'Outras',
    ],
  },
];

const fontesRuidoVibracao = [
  {
    id: 'frente_lavra_ruido',
    label: 'Frente de lavra – desmonte de rochas',
    emissoes: ['Ruídos', 'Vibrações'],
    medidas: [
      'Monitoramento de vibrações (NBR 9.653/2005)',
      'Monitoramento de ruídos (NBR 10.151 e 10.152)',
      'Outras',
    ],
  },
  {
    id: 'ventilacao_ruido',
    label: 'Sistema de ventilação da mina',
    emissoes: ['Ruídos'],
    medidas: [
      'Monitoramento de ruídos e proteção acústica',
      'Outras',
    ],
  },
  {
    id: 'britagem_ruido',
    label: 'Operações de britagem',
    emissoes: ['Ruídos', 'Vibrações'],
    medidas: [
      'Sistema de britagem com proteção acústica – enclausurado',
      'Monitoramento de vibrações (NBR 9.653/2005)',
      'Monitoramento de ruídos (NBR 10.151 e 10.152)',
      'Outras',
    ],
  },
  {
    id: 'moagem_ruido',
    label: 'Operações de moagem',
    emissoes: ['Ruídos', 'Vibrações'],
    medidas: [
      'Sistema de moagem com proteção acústica – enclausurado',
      'Monitoramento de vibrações (NBR 9.653/2005)',
      'Monitoramento de ruídos (NBR 10.151 e 10.152)',
      'Outras',
    ],
  },
];

function EmissaoMatrix({
  form,
  basePath,
  fontes,
}: {
  form: any;
  basePath: string;
  fontes: typeof fontesEmissaoAtmosferica;
}) {
  return (
    <div className="space-y-4">
      {fontes.map((fonte) => (
        <div key={fonte.id} className="space-y-3 rounded-md border p-3">
          <FormField
            control={form.control}
            name={`${basePath}.${fonte.id}.ativo`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                </FormControl>
                <FormLabel className="font-medium">{fonte.label}</FormLabel>
              </FormItem>
            )}
          />
          {form.watch(`${basePath}.${fonte.id}.ativo`) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Emissões</p>
                <CheckboxOptions
                  form={form}
                  name={`${basePath}.${fonte.id}.emissoes`}
                  options={fonte.emissoes.map((e) => ({ id: e, label: e }))}
                />
                <TextField
                  form={form}
                  name={`${basePath}.${fonte.id}.emissoesOutros`}
                  label="Outros – especificar"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Medidas de controle</p>
                <CheckboxOptions
                  form={form}
                  name={`${basePath}.${fonte.id}.medidas`}
                  options={fonte.medidas.map((m) => ({ id: m, label: m }))}
                />
                <TextField
                  form={form}
                  name={`${basePath}.${fonte.id}.medidasOutros`}
                  label="Outros – especificar"
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <TextField form={form} name={`${basePath}.outrasFontes`} label="Outras fontes – especificar" />
    </div>
  );
}

export function FormListagemATecnico({ form, parte = 'completo' }: FormListagemATecnicoProps) {
  const utilizaEnergia = form.watch('listagemA.energetico.utilizaEnergia');
  const usaGeracaoDiesel = form.watch('listagemA.energetico.tipos')?.includes('geracao_diesel');
  const usaRedeEletrica = form.watch('listagemA.energetico.tipos')?.includes('rede_eletrica');
  const haBarragemDesmonte = form.watch('listagemA.barragemDesmonte.haBarragem');
  const houveSupressao = form.watch('listagemA.reflorestamento.houveSupressao');
  const trataAguaNova = form.watch('listagemA.tratamentoAguaNova.trataAgua');
  const recirculaAgua = form.watch('listagemA.usoAgua.recirculaAgua');
  const reusoAguaIndustrial = form.watch('listagemA.tratamentoAguaIndustrial.promoveReuso');
  const necessitaEtaIndustrial = form.watch('listagemA.tratamentoAguaIndustrial.necessitaEta');
  const necessitaTratamentoEfluente = form.watch('listagemA.tratamentoEfluentesIndustriais.necessitaTratamento');
  const levantamentoAguaSub = form.watch('listagemA.qualidadeAguaSubterranea.realizouLevantamento');
  const haPassivo = form.watch('listagemA.passivosAmbientais.existePassivo');

  const { fields: especiesReflorestamento, append: appendEspecie, remove: removeEspecie } = useFieldArray({
    control: form.control,
    name: 'listagemA.reflorestamento.especies',
  });
  const { fields: pontosSanitarios, append: appendPontoSanitario, remove: removePontoSanitario } = useFieldArray({
    control: form.control,
    name: 'listagemA.efluentesSanitarios.pontos',
  });
  const { fields: pontosRefeitorio, append: appendPontoRefeitorio, remove: removePontoRefeitorio } = useFieldArray({
    control: form.control,
    name: 'listagemA.efluentesRefeitorio.pontos',
  });
  const { fields: pontosOleosos, append: appendPontoOleoso, remove: removePontoOleoso } = useFieldArray({
    control: form.control,
    name: 'listagemA.efluentesOleosos.pontos',
  });
  const { fields: pontosIndustriais, append: appendPontoIndustrial, remove: removePontoIndustrial } = useFieldArray({
    control: form.control,
    name: 'listagemA.efluentesIndustriais.pontos',
  });
  const { fields: outrosParametros, append: appendOutroParam, remove: removeOutroParam } = useFieldArray({
    control: form.control,
    name: 'listagemA.caracteristicasEfluenteBruto.outrosParametros',
  });

  const mostrar2736 = incluiParte(parte, '27-36');
  const mostrar3753 = incluiParte(parte, '37-53');
  const mostrar5759 = incluiParte(parte, '57-59');

  return (
    <div className="space-y-6">
      {mostrar2736 ? (
      <>
      {/* 27 */}
      <SectionCard title="27. ENERGÉTICO">
        <FormField
          control={form.control}
          name="listagemA.energetico.utilizaEnergia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento utiliza quantitativamente energia?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {utilizaEnergia && (
          <>
            <CheckboxOptions
              form={form}
              name="listagemA.energetico.tipos"
              options={[
                { id: 'geracao_diesel', label: 'Geração própria – Diesel' },
                { id: 'rede_eletrica', label: 'Rede elétrica' },
                { id: 'geracao_indireta', label: 'Geração indireta própria' },
                { id: 'geracao_terceiros', label: 'Geração por terceiros' },
                { id: 'outras', label: 'Outras' },
              ]}
            />
            {usaGeracaoDiesel && (
              <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-2">
                <TextField form={form} name="listagemA.energetico.diesel.manutencaoFrequente" label="Manutenção frequente do gerador" />
                <NumField form={form} name="listagemA.energetico.diesel.capacidadeGeradorKva" label="Capacidade do gerador (kVA)" />
                <NumField form={form} name="listagemA.energetico.diesel.consumoMensalL" label="Consumo mensal (L)" />
                <NumField form={form} name="listagemA.energetico.diesel.potenciaInstaladaKw" label="Potência instalada (kW)" />
              </div>
            )}
            {usaRedeEletrica && (
              <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-2">
                <NumField form={form} name="listagemA.energetico.rede.energiaComercialMensalKwh" label="Energia comercial mensal (kWh)" />
                <NumField form={form} name="listagemA.energetico.rede.potenciaInstaladaConsumoKw" label="Potência instalada consumo (kW)" />
                <NumField form={form} name="listagemA.energetico.rede.potenciaBtKw" label="Potência BT (kW)" />
                <NumField form={form} name="listagemA.energetico.rede.demandaKw" label="Demanda (kW)" />
                <TextField form={form} name="listagemA.energetico.rede.barraReferencia" label="Barra de referência" />
                <TextField form={form} name="listagemA.energetico.rede.tensao" label="Tensão" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumField form={form} name="listagemA.energetico.geracaoIndireta.consumoMensal" label="Geração indireta – consumo mensal" />
              <NumField form={form} name="listagemA.energetico.geracaoTerceiros.consumoMensal" label="Geração terceiros – consumo mensal" />
              <NumField form={form} name="listagemA.energetico.geracaoTerceiros.demanda" label="Geração terceiros – demanda" />
              <TextField form={form} name="listagemA.energetico.outrasEspecificar" label="Outras – especificar" />
            </div>
          </>
        )}
      </SectionCard>

      {/* 28 */}
      <SectionCard title="28. DESENVOLVIMENTO DE BARRAGEM DE DESMONTE">
        <FormField
          control={form.control}
          name="listagemA.barragemDesmonte.haBarragem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há barragem de desmonte no empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haBarragemDesmonte && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField form={form} name="listagemA.barragemDesmonte.identificacao" label="Identificação da barragem" />
            <TextField form={form} name="listagemA.barragemDesmonte.tipo" label="Tipo de barragem" />
            <TextField form={form} name="listagemA.barragemDesmonte.classificacaoRisco" label="Classificação de risco" />
            <NumField form={form} name="listagemA.barragemDesmonte.alturaMaximaM" label="Altura máxima (m)" />
            <NumField form={form} name="listagemA.barragemDesmonte.comprimentoCristaM" label="Comprimento da crista (m)" />
            <NumField form={form} name="listagemA.barragemDesmonte.volumeProjetoM3" label="Volume de projeto (m³)" />
            <NumField form={form} name="listagemA.barragemDesmonte.areaReservatorioM2" label="Área do reservatório (m²)" />
            <TextField form={form} name="listagemA.barragemDesmonte.situacaoLicenciamento" label="Situação de licenciamento" />
            <TextField form={form} name="listagemA.barragemDesmonte.processoDnpm" label="Processo DNPM" />
            <TextField form={form} name="listagemA.barragemDesmonte.medidasControle" label="Medidas de controle" className="md:col-span-3" />
            <FormField
              control={form.control}
              name="listagemA.barragemDesmonte.observacoes"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Observações complementares</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </SectionCard>

      {/* 29 */}
      <SectionCard title="29. AUTORIZAÇÃO E LICENCIAMENTO PARA REFLORESTAMENTO">
        <FormField
          control={form.control}
          name="listagemA.reflorestamento.houveSupressao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Houve supressão de vegetação para implantação da atividade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {houveSupressao && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <NumField form={form} name="listagemA.reflorestamento.areaSuprimidaHa" label="Área suprimida (ha)" />
              <TextField form={form} name="listagemA.reflorestamento.autorizacaoSupressao" label="Autorização de supressão" />
              <NumField form={form} name="listagemA.reflorestamento.areaReflorestamentoHa" label="Área de reflorestamento (ha)" />
            </div>
            {especiesReflorestamento.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
                <TextField form={form} name={`listagemA.reflorestamento.especies.${index}.especie`} label="Espécie" />
                <NumField form={form} name={`listagemA.reflorestamento.especies.${index}.quantidade`} label="Quantidade" />
                <TextField form={form} name={`listagemA.reflorestamento.especies.${index}.origem`} label="Origem do material" />
                <div className="flex items-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEspecie(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendEspecie({ especie: '', quantidade: '', origem: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar espécie
            </Button>
          </>
        )}
      </SectionCard>

      {/* 30 */}
      <SectionCard title="30. LAVRA">
        <CheckboxOptions
          form={form}
          name="listagemA.lavra.metodos"
          options={[
            { id: 'céu_aberto', label: 'Lavra a céu aberto' },
            { id: 'subterranea', label: 'Lavra subterrânea' },
            { id: 'dragagem', label: 'Dragagem' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemA.lavra.profundidadeMaximaM" label="Profundidade máxima (m)" />
          <NumField form={form} name="listagemA.lavra.areaLavraHa" label="Área de lavra (ha)" />
          <NumField form={form} name="listagemA.lavra.producaoDiariaT" label="Produção diária (t/dia)" />
          <FormField
            control={form.control}
            name="listagemA.lavra.utilizaDetonacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Utiliza detonação?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <TextField form={form} name="listagemA.lavra.frequenciaDetonacao" label="Frequência de detonação" />
          <TextField form={form} name="listagemA.lavra.controleEmissoesDetonacao" label="Controle de emissões na detonação" />
        </div>
        <FormField
          control={form.control}
          name="listagemA.lavra.descricaoOperacional"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição operacional da lavra</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      {/* 31 */}
      <SectionCard title="31. PROCESSO DE BENEFICIAMENTO">
        <CheckboxOptions
          form={form}
          name="listagemA.beneficiamento.etapas"
          options={[
            { id: 'britagem', label: 'Britagem' },
            { id: 'moagem', label: 'Moagem' },
            { id: 'classificacao', label: 'Classificação' },
            { id: 'flotacao', label: 'Flotação' },
            { id: 'concentracao_gravimetrica', label: 'Concentração gravimétrica' },
            { id: 'secagem', label: 'Secagem' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemA.beneficiamento.capacidadeInstaladaTpd" label="Capacidade instalada (t/dia)" />
          <NumField form={form} name="listagemA.beneficiamento.consumoAguaM3Dia" label="Consumo de água (m³/dia)" />
          <NumField form={form} name="listagemA.beneficiamento.consumoEnergiaKwhMes" label="Consumo de energia (kWh/mês)" />
        </div>
        <TextField form={form} name="listagemA.beneficiamento.outrosEspecificar" label="Outros – especificar" />
      </SectionCard>

      {/* 32 */}
      <SectionCard title="32. CARACTERIZAÇÃO DO REJEITO">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField form={form} name="listagemA.caracterizacaoRejeito.tipoRejeito" label="Tipo de rejeito" />
          <NumField form={form} name="listagemA.caracterizacaoRejeito.producaoDiariaT" label="Produção diária (t/dia)" />
          <NumField form={form} name="listagemA.caracterizacaoRejeito.umidadePercentual" label="Umidade (%)" />
          <TextField form={form} name="listagemA.caracterizacaoRejeito.destinacao" label="Destinação" />
          <TextField form={form} name="listagemA.caracterizacaoRejeito.armazenamento" label="Forma de armazenamento" className="md:col-span-2" />
        </div>
        <FormField
          control={form.control}
          name="listagemA.caracterizacaoRejeito.caracterizacaoGeoquimica"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caracterização geoquímica</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      {/* 33 */}
      <SectionCard title="33. MEIOS DEMONSTRATIVOS – ÁREAS CÁRSTICAS">
        <FormField
          control={form.control}
          name="listagemA.areasCarsticas.localizadoEmAreaCarstica"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empreendimento localizado em área cárstica?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemA.areasCarsticas.meiosDemonstrativos" label="Meios demonstrativos de não invasão" className="md:col-span-2" />
      </SectionCard>

      {/* 34 */}
      <SectionCard title="34. CONSTRUÇÃO E OPERAÇÃO DE ESTÁCIO">
        <FormField
          control={form.control}
          name="listagemA.estacio.possuiEstacio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui estácio de armazenamento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemA.estacio.areaHa" label="Área (ha)" />
          <NumField form={form} name="listagemA.estacio.capacidadeM3" label="Capacidade (m³)" />
          <TextField form={form} name="listagemA.estacio.tipoEstacio" label="Tipo de estácio" />
        </div>
      </SectionCard>

      {/* 35 */}
      <SectionCard title="35. COMPRESSORES DE AR">
        <FormField
          control={form.control}
          name="listagemA.compressores.possui"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel>Compressor de ar</FormLabel>
            </FormItem>
          )}
        />
        {form.watch('listagemA.compressores.possui') && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NumField form={form} name="listagemA.compressores.capacidadeNominalM3h" label="Capacidade nominal de compressão (m³/h)" />
            <NumField form={form} name="listagemA.compressores.volumeAguaPurgaLdia" label="Volume de água de purga gerada (L/dia)" />
          </div>
        )}
      </SectionCard>

      {/* 36 */}
      <SectionCard title="36. ABASTECIMENTO DE COMBUSTÍVEIS">
        <FormField
          control={form.control}
          name="listagemA.abastecimento.possui"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
              </FormControl>
              <FormLabel>Posto de abastecimento de veículo</FormLabel>
            </FormItem>
          )}
        />
        {form.watch('listagemA.abastecimento.possui') && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NumField form={form} name="listagemA.abastecimento.capacidadeArmazenamentoM3" label="Capacidade de armazenamento (m³)" />
            <FormField
              control={form.control}
              name="listagemA.abastecimento.cumpreDn108"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cumpre integralmente a DN 108/2007?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </SectionCard>
      </>
      ) : null}

      {mostrar3753 ? (
      <>
      {/* 37 */}
      <SectionCard title="37. TRATAMENTO DE ÁGUA INDUSTRIAL DAS UNIDADES AUXILIARES DA LAVRA">
        <FormField
          control={form.control}
          name="listagemA.tratamentoAguaIndustrial.promoveReuso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento irá promover o reuso da água de processo?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {reusoAguaIndustrial && (
          <FormField
            control={form.control}
            name="listagemA.tratamentoAguaIndustrial.necessitaEta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Para o reuso, será necessário tratamento através de ETA industrial?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        {reusoAguaIndustrial && necessitaEtaIndustrial && (
          <>
            <CheckboxOptions
              form={form}
              name="listagemA.tratamentoAguaIndustrial.etaSituacao"
              options={[
                { id: 'existente_licenciada', label: 'Já existente e já foi alvo de licenciamento anterior' },
                { id: 'escopo_atual', label: 'Faz parte do escopo deste licenciamento' },
              ]}
            />
            <CheckboxOptions form={form} name="listagemA.tratamentoAguaIndustrial.etapas" options={etapasTratamentoAgua} />
            <TextField form={form} name="listagemA.tratamentoAguaIndustrial.etapasOutros" label="Outros – especificar" />
            <NumField form={form} name="listagemA.tratamentoAguaIndustrial.capacidadeNominalM3h" label="Capacidade nominal da nova ETA industrial (m³/h)" />
          </>
        )}
      </SectionCard>

      {/* 38 */}
      <SectionCard title="38. SISTEMAS E EDIFICAÇÕES DAS UNIDADES AUXILIARES DA LAVRA">
        {[
          { key: 'escritorios', label: 'Escritórios', fields: ['areaConstruidaM2', 'numFuncionarios', 'numBanheiros'] },
          { key: 'refeitorio', label: 'Refeitório', fields: ['areaConstruidaM2', 'numRefeicoesDiarias', 'numBanheiros'] },
          { key: 'oficinas', label: 'Oficinas', fields: ['areaConstruidaM2', 'numFuncionarios', 'numBanheiros'] },
          { key: 'patioResiduos', label: 'Pátio de resíduos', fields: ['areaConstruidaM2', 'numFuncionarios', 'numBanheiros'] },
          { key: 'almoxarifado', label: 'Almoxarifado', fields: ['areaConstruidaM2', 'numFuncionarios', 'numBanheiros'] },
        ].map((sistema) => (
          <div key={sistema.key} className="space-y-3 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemA.sistemasAuxiliares.${sistema.key}.ativo`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormLabel>{sistema.label}</FormLabel>
                </FormItem>
              )}
            />
            {form.watch(`listagemA.sistemasAuxiliares.${sistema.key}.ativo`) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {sistema.fields.map((f) => (
                  <TextField
                    key={f}
                    form={form}
                    name={`listagemA.sistemasAuxiliares.${sistema.key}.${f}`}
                    label={f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      {/* 39 */}
      <SectionCard title="39. USO DE ÁGUA">
        <FormField
          control={form.control}
          name="listagemA.usoAgua.recirculaAgua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento recircula a água utilizada?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {recirculaAgua && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NumField form={form} name="listagemA.usoAgua.volumeRecirculadoM3Mes" label="Volume recirculado (m³/mês)" />
            <NumField form={form} name="listagemA.usoAgua.percentualRecirculada" label="Porcentagem de água recirculada (%)" />
          </div>
        )}
        <FormDescription>Consumo por finalidade (m³/dia)</FormDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Finalidade</TableHead>
              <TableHead>Consumo diário máximo</TableHead>
              <TableHead>Consumo diário médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalidadesAgua.map((finalidade) => {
              const slug = finalidade
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '_')
                .toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell className="font-medium">{finalidade}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.usoAgua.finalidades.${slug}.maximo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.usoAgua.finalidades.${slug}.medio`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold">Consumo total diário</TableCell>
              <TableCell>
                <NumField form={form} name="listagemA.usoAgua.consumoTotalMaximo" label="" />
              </TableCell>
              <TableCell>
                <NumField form={form} name="listagemA.usoAgua.consumoTotalMedio" label="" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TextField form={form} name="listagemA.usoAgua.outrasFinalidadesEspecificar" label="Outras finalidades – especificar" />
      </SectionCard>

      {/* 40 */}
      <SectionCard title="40. TRATAMENTO DE ÁGUA NOVA">
        <FormField
          control={form.control}
          name="listagemA.tratamentoAguaNova.trataAgua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento trata água?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {trataAguaNova && (
          <>
            <NumField form={form} name="listagemA.tratamentoAguaNova.quantidadeTratadaM3Mes" label="Quantidade de água tratada (m³/mês)" />
            <CheckboxOptions form={form} name="listagemA.tratamentoAguaNova.etapas" options={etapasTratamentoAgua} />
            <TextField form={form} name="listagemA.tratamentoAguaNova.etapasOutros" label="Outros – especificar" />
          </>
        )}
      </SectionCard>

      {/* 41 */}
      <SectionCard title="41. EFLUENTES LÍQUIDOS GERADOS">
        <FormDescription>
          Marque fonte, efluente e medida de controle conforme o formulário de referência.
        </FormDescription>
        <FormField
          control={form.control}
          name="listagemA.efluentesLiquidos.descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição dos efluentes e medidas de controle</FormLabel>
              <FormControl>
                <Textarea rows={6} placeholder="Atividades no interior da mina; escritórios/oficinas; desaguamento; processos industriais; oficinas; drenagem; refeitório; outros." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <CheckboxOptions
          form={form}
          name="listagemA.efluentesLiquidos.fontes"
          options={[
            { id: 'pessoas_interior_mina', label: 'Atividades de pessoas no interior da mina' },
            { id: 'pessoas_instalacoes', label: 'Atividades em escritórios, oficinas, almoxarifado e demais instalações' },
            { id: 'desaguamento_mina', label: 'Remoção de água da mina (lençol e processo de lavra)' },
            { id: 'processos_industriais', label: 'Processos industriais: britagem, moagem, flotação etc.' },
            { id: 'oficinas', label: 'Efluentes gerados nas atividades da(s) oficina(s)' },
            { id: 'drenagem_mina', label: 'Drenagem de mina' },
            { id: 'refeitorio', label: 'Refeitório' },
            { id: 'outros', label: 'Outros efluentes' },
          ]}
        />
      </SectionCard>

      {/* 42 */}
      <SectionCard title="42. EFLUENTES SANITÁRIOS">
        <NumField form={form} name="listagemA.efluentesSanitarios.volumeM3Dia" label="Volume do efluente sanitário gerado (m³/dia)" />
        <NumField form={form} name="listagemA.efluentesSanitarios.qtdSistemasTratamento" label="Quantidade de sistemas de tratamento receptores" />
        <p className="text-sm font-medium">Identificação e descrição de todos os pontos:</p>
        {pontosSanitarios.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.efluentesSanitarios.pontos.${index}.identificacao`} label="Identificação" />
            <TextField form={form} name={`listagemA.efluentesSanitarios.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <NumField form={form} name={`listagemA.efluentesSanitarios.pontos.${index}.volumeTratadoM3Dia`} label="Volume tratado (m³/dia)" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removePontoSanitario(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendPontoSanitario({ identificacao: '', descricao: '', volumeTratadoM3Dia: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar ponto
        </Button>
      </SectionCard>

      {/* 43 */}
      <SectionCard title="43. EFLUENTES DE REFEITÓRIO">
        <NumField form={form} name="listagemA.efluentesRefeitorio.volumeM3Dia" label="Volume do efluente gerado em refeitório (m³/dia)" />
        <NumField form={form} name="listagemA.efluentesRefeitorio.qtdSistemasTratamento" label="Quantidade de sistemas de tratamento receptores" />
        {pontosRefeitorio.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.efluentesRefeitorio.pontos.${index}.identificacao`} label="Identificação" />
            <TextField form={form} name={`listagemA.efluentesRefeitorio.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <NumField form={form} name={`listagemA.efluentesRefeitorio.pontos.${index}.volumeTratadoM3Dia`} label="Volume tratado (m³/dia)" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removePontoRefeitorio(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendPontoRefeitorio({ identificacao: '', descricao: '', volumeTratadoM3Dia: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar ponto
        </Button>
      </SectionCard>

      {/* 44 */}
      <SectionCard title="44. EFLUENTES OLEOSOS">
        <NumField form={form} name="listagemA.efluentesOleosos.volumeM3Dia" label="Volume do efluente oleoso gerado (m³/dia)" />
        <NumField form={form} name="listagemA.efluentesOleosos.qtdSistemasTratamento" label="Quantidade de sistemas de tratamento receptores" />
        {pontosOleosos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.efluentesOleosos.pontos.${index}.identificacao`} label="Identificação" />
            <TextField form={form} name={`listagemA.efluentesOleosos.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <NumField form={form} name={`listagemA.efluentesOleosos.pontos.${index}.volumeTratadoM3Dia`} label="Volume tratado (m³/dia)" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removePontoOleoso(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendPontoOleoso({ identificacao: '', descricao: '', volumeTratadoM3Dia: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar ponto
        </Button>
      </SectionCard>

      {/* 45 */}
      <SectionCard title="45. EFLUENTES INDUSTRIAIS">
        <NumField form={form} name="listagemA.efluentesIndustriais.volumeM3Dia" label="Volume do efluente industrial gerado (m³/dia)" />
        <NumField form={form} name="listagemA.efluentesIndustriais.qtdSistemasTratamento" label="Quantidade de sistemas de tratamento de efluentes industriais" />
        {pontosIndustriais.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.efluentesIndustriais.pontos.${index}.identificacao`} label="Identificação" />
            <TextField form={form} name={`listagemA.efluentesIndustriais.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <NumField form={form} name={`listagemA.efluentesIndustriais.pontos.${index}.volumeTratadoM3Dia`} label="Volume tratado (m³/dia)" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removePontoIndustrial(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendPontoIndustrial({ identificacao: '', descricao: '', volumeTratadoM3Dia: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar efluente
        </Button>
      </SectionCard>

      {/* 46 */}
      <SectionCard title="46. CARACTERÍSTICAS DE CADA EFLUENTE INDUSTRIAL BRUTO – Antes do Tratamento">
        <TextField form={form} name="listagemA.caracteristicasEfluenteBruto.efluenteIdDescricao" label="Efluente (ID/descrição)" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parâmetros</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Valor mínimo</TableHead>
              <TableHead>Valor máximo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parametrosEfluenteBruto.map((p) => {
              const slug = p.parametro.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell>{p.parametro}</TableCell>
                  <TableCell>{p.unidade}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.caracteristicasEfluenteBruto.parametros.${slug}.minimo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.caracteristicasEfluenteBruto.parametros.${slug}.maximo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {outrosParametros.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.caracteristicasEfluenteBruto.outrosParametros.${index}.parametro`} label="Parâmetro" />
            <TextField form={form} name={`listagemA.caracteristicasEfluenteBruto.outrosParametros.${index}.unidade`} label="Unidade" />
            <NumField form={form} name={`listagemA.caracteristicasEfluenteBruto.outrosParametros.${index}.minimo`} label="Mínimo" />
            <NumField form={form} name={`listagemA.caracteristicasEfluenteBruto.outrosParametros.${index}.maximo`} label="Máximo" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOutroParam(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendOutroParam({ parametro: '', unidade: '', minimo: '', maximo: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar parâmetro
        </Button>
      </SectionCard>

      {/* 47 */}
      <SectionCard title="47. TRATAMENTO DOS EFLUENTES SANITÁRIOS">
        <CheckboxOptions
          form={form}
          name="listagemA.tratamentoEfluentesSanitarios.opcoes"
          options={[
            { id: 'conjunto_industrial', label: 'Tratamento exclusivamente em conjunto com o efluente industrial (ir para item 48)' },
            { id: 'fossa_septica', label: 'Fossa séptica' },
            { id: 'filtro_anaerobico', label: 'Filtro anaeróbico' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <TextField form={form} name="listagemA.tratamentoEfluentesSanitarios.outrosListar" label="Outros – listar" />
      </SectionCard>

      {/* 48 */}
      <SectionCard title="48. TRATAMENTO DE EFLUENTES OLEOSOS">
        <CheckboxOptions
          form={form}
          name="listagemA.tratamentoEfluentesOleosos.etapas"
          options={[
            { id: 'decantacao', label: 'Decantação para remoção de sólidos em suspensão' },
            { id: 'caixa_separadora', label: 'Caixa separadora água-óleo' },
            { id: 'coagulacao', label: 'Coagulação química para remoção de produtos emulsionados' },
            { id: 'sedimentacao', label: 'Sedimentação do precipitado após coagulação' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <TextField form={form} name="listagemA.tratamentoEfluentesOleosos.outrosEspecificar" label="Outros – especificar" />
      </SectionCard>

      {/* 49 */}
      <SectionCard title="49. TRATAMENTO DE EFLUENTES INDUSTRIAIS">
        <FormField
          control={form.control}
          name="listagemA.tratamentoEfluentesIndustriais.necessitaTratamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Será necessário tratamento de efluentes para lançamento em curso d&apos;água?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {necessitaTratamentoEfluente && (
          <>
            <CheckboxOptions
              form={form}
              name="listagemA.tratamentoEfluentesIndustriais.eteSituacao"
              options={[
                { id: 'existente_licenciada', label: 'ETE já existente e já licenciada anteriormente' },
                { id: 'escopo_atual', label: 'ETE faz parte do escopo deste licenciamento' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemA.tratamentoEfluentesIndustriais.etapas"
              options={[
                { id: 'precipitacao_quimica', label: 'Precipitação química de metais e semimetais' },
                { id: 'precipitacao_bioquimica', label: 'Precipitação bioquímica de metais e semimetais' },
                { id: 'correcao_ph', label: 'Correção de pH' },
                { id: 'dessalinizacao_quimica', label: 'Dessalinização por precipitação química' },
                { id: 'dessalinizacao_resina', label: 'Dessalinização por resina de troca iônica' },
                { id: 'remocao_solidos', label: 'Remoção de sólidos em suspensão' },
                { id: 'osmose_reversa', label: 'Dessalinização por osmose reversa' },
                { id: 'remocao_nitrogenio', label: 'Remoção de compostos nitrogenados (biológico)' },
                { id: 'lodo_ativado', label: 'Remoção de carga orgânica por lodo ativado' },
                { id: 'outros', label: 'Outros tipos de tratamento' },
              ]}
            />
            <TextField form={form} name="listagemA.tratamentoEfluentesIndustriais.etapasOutros" label="Outros – descrever" />
            <NumField form={form} name="listagemA.tratamentoEfluentesIndustriais.capacidadeNominalM3h" label="Capacidade nominal da nova ETE (m³/h)" />
          </>
        )}
      </SectionCard>

      {/* 50 */}
      <SectionCard title="50. DESTINO FINAL DOS EFLUENTES">
        <CheckboxOptions
          form={form}
          name="listagemA.destinoFinalEfluentes.opcoes"
          options={[
            { id: 'recurso_hidrico', label: 'Descarte em recurso hídrico' },
            { id: 'rede_publica', label: 'Descarte em rede pública' },
            { id: 'fertirrigacao', label: 'Fertirrigação' },
            { id: 'lagoa_infiltracao', label: 'Lagoa de infiltração' },
            { id: 'sumidouro', label: 'Sumidouro' },
            { id: 'tratamento_conjunto', label: 'Após tratamento preliminar segue com efluente industrial' },
            { id: 'reutilizacao', label: 'Reutilização no processo produtivo' },
            { id: 'outro', label: 'Outro' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField form={form} name="listagemA.destinoFinalEfluentes.nomeCorpoHidrico" label="Nome do corpo hídrico" />
          <CheckboxOptions
            form={form}
            name="listagemA.destinoFinalEfluentes.classeEnquadramento"
            options={[
              { id: 'especial', label: 'Classe especial' },
              { id: '1', label: 'Classe 1' },
              { id: '2', label: 'Classe 2' },
              { id: '3', label: 'Classe 3' },
              { id: '4', label: 'Classe 4' },
            ]}
          />
          <FormField
            control={form.control}
            name="listagemA.destinoFinalEfluentes.municipioTrataEsgoto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Município possui tratamento de esgoto urbano?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <NumField form={form} name="listagemA.destinoFinalEfluentes.percentualEsgotoTratado" label="Porcentagem do esgoto tratado (%)" />
          <TextField form={form} name="listagemA.destinoFinalEfluentes.outroEspecificar" label="Outro – especificar" className="md:col-span-2" />
        </div>
      </SectionCard>

      {/* 51 */}
      <SectionCard title="51. EMISSÕES ATMOSFÉRICAS E MEDIDAS DE CONTROLE">
        <EmissaoMatrix form={form} basePath="listagemA.emissoesAtmosfericas" fontes={fontesEmissaoAtmosferica} />
      </SectionCard>

      {/* 52 */}
      <SectionCard title="52. RUÍDOS, VIBRAÇÕES E MEDIDAS DE CONTROLE">
        <EmissaoMatrix form={form} basePath="listagemA.ruidosVibracoes" fontes={fontesRuidoVibracao} />
      </SectionCard>

      {/* 53 */}
      <SectionCard title="53. RESÍDUOS SÓLIDOS">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do resíduo</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Destino final</TableHead>
              <TableHead>Empresa transporte</TableHead>
              <TableHead>Empresa destinação</TableHead>
              <TableHead>CNPJ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposResiduosSolidos.map((residuo) => {
              const slug = residuo.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell className="font-medium">{residuo}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.residuosSolidos.${slug}.classe`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.residuosSolidos.${slug}.destinoFinal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.residuosSolidos.${slug}.empresaTransporte`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.residuosSolidos.${slug}.empresaDestinacao`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.residuosSolidos.${slug}.cnpj`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TextField form={form} name="listagemA.residuosSolidos.outrosEspecificar" label="Outros resíduos – especificar" />
      </SectionCard>
      </>
      ) : null}

      {mostrar5759 ? (
      <>
      {/* 57 */}
      <SectionCard title="57. QUALIDADE DAS ÁGUAS SUBTERRÂNEAS">
        <FormField
          control={form.control}
          name="listagemA.qualidadeAguaSubterranea.permeabilidadeSolo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permeabilidade do solo (k)</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Baixíssima / muito baixa / baixa / alta (arenoso ou fraturado)" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemA.qualidadeAguaSubterranea.realizouLevantamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foi realizado levantamento da qualidade das águas subterrâneas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {levantamentoAguaSub && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parâmetro</TableHead>
                <TableHead>Ponto 1</TableHead>
                <TableHead>Ponto 2</TableHead>
                <TableHead>Ponto 3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parametrosAguaSubterranea.map((param) => {
                const slug = param.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
                return (
                  <TableRow key={slug}>
                    <TableCell>{param}</TableCell>
                    {['ponto1', 'ponto2', 'ponto3'].map((ponto) => (
                      <TableCell key={ponto}>
                        <FormField
                          control={form.control}
                          name={`listagemA.qualidadeAguaSubterranea.parametros.${slug}.${ponto}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} value={field.value ?? ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {/* 58 */}
      <SectionCard title="58. QUALIDADE DAS ÁGUAS SUPERFICIAIS">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parâmetro</TableHead>
              <TableHead>Ponto 1</TableHead>
              <TableHead>Ponto 2</TableHead>
              <TableHead>Referência COPAM/CERH 01/2008</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parametrosAguaSuperficial.map((param) => {
              const slug = param.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell>{param}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.qualidadeAguaSuperficial.parametros.${slug}.ponto1`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.qualidadeAguaSuperficial.parametros.${slug}.ponto2`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemA.qualidadeAguaSuperficial.parametros.${slug}.referencia`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>

      {/* 59 */}
      <SectionCard title="59. PASSIVOS AMBIENTAIS">
        <FormField
          control={form.control}
          name="listagemA.passivosAmbientais.existePassivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há passivo ambiental associado ao empreendimento requerente?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haPassivo && (
          <FormField
            control={form.control}
            name="listagemA.passivosAmbientais.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Informar passivos existentes e alternativas de intervenção</FormLabel>
                <FormControl>
                  <Textarea rows={5} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <p className="text-sm text-muted-foreground">
          Atenção: em caso de aquisição de terreno ou instalação industrial em operação ou desativada, recomenda-se levantamento prévio de passivos ambientais.
        </p>
      </SectionCard>
      </>
      ) : null}
    </div>
  );
}
