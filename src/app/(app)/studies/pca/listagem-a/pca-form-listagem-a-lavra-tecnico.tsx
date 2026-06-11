'use client';



import * as React from 'react';

import { useFieldArray } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Checkbox } from '@/components/ui/checkbox';

import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { PlusCircle, Trash2 } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

import {

  PcaBooleanRadio,

  PcaCheckboxOptions,

  PcaNumField,

  PcaSectionCard,

  PcaTabelaLinhasFixas,

  PcaTextField,

  PcaTextAreaField,

  PcaSituacaoRegularizacao,

} from './pca-form-listagem-a-helpers';

import { PcaFormListagemATecnicoSecoes } from './pca-form-listagem-a-tecnico-secoes';
const metodologiasLavra = [
  { id: 'subniveis_abatimento', label: 'Abatimento em sub-níveis' },
  { id: 'blocos', label: 'Abatimento por blocos' },
  { id: 'longwall', label: 'Longwall' },
  { id: 'corte_aterro', label: 'Corte e aterro' },
  { id: 'camara_pilar', label: 'Câmaras e pilares' },
  { id: 'subniveis', label: 'Método de sub-níveis' },
  { id: 'recalque', label: 'Recalque' },
  { id: 'outro', label: 'Outro' },
];

const processosBeneficiamento = [
  { id: 'britagem_primaria', label: 'Britagem primária' },
  { id: 'britagem_secundaria', label: 'Britagem secundária' },
  { id: 'britagem_terciaria', label: 'Britagem terciária' },
  { id: 'moagem', label: 'Moagem' },
  { id: 'classificacao', label: 'Classificação' },
  { id: 'concentracao', label: 'Concentração' },
  { id: 'filtragem', label: 'Filtragem' },
  { id: 'secagem', label: 'Secagem' },
  { id: 'lapidacao', label: 'Lapidação' },
];

const impactosMeioFisico = [
  'Contaminação do solo',
  'Contaminação do ar',
  'Compactação do solo',
  'Contaminação de águas superficiais',
  'Erosão',
  'Derramamento de óleo/combustíveis',
  'Vazamento de combustíveis armazenados',
  'Impermeabilização do solo',
  'Assoreamento de cursos d’água',
  'Contaminação por esgoto de canteiro',
  'Intervenção em nascentes',
  'Emissão de material particulado (poeira)',
  'Emissões atmosféricas de equipamentos',
  'Ruído',
  'Alteração da paisagem',
];

const impactosMeioBiotico = [
  'Destruição de habitat e afugentamento da fauna',
  'Fragmentação florestal',
  'Aumento de vetores',
  'Risco de eutrofização',
  'Supressão de vegetação',
  'Intervenção em APP',
];

const impactosMeioSocioeconomico = [
  'Dificuldade de relacionamento com população local',
  'Risco à saúde',
  'Geração de empregos',
  'Arrecadação de impostos',
];

const zeeGeofisicoLavra = [
  { id: 'potencialidadeSocial', label: 'Potencialidade social', options: ['Muito precário', 'Precário', 'Pouco favorável', 'Favorável', 'Muito favorável'] },
  { id: 'vulnerabilidadeNatural', label: 'Vulnerabilidade natural', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'] },
  { id: 'suscetibilidadeErosao', label: 'Vulnerabilidade do solo à erosão', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'] },
  { id: 'riscoAmbiental', label: 'Risco ambiental', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'] },
  { id: 'qualidadeAguaSuperficial', label: 'Qualidade da água superficial', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta', 'Total comprometido'] },
  { id: 'integridadeFauna', label: 'Integridade fauna', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'] },
  { id: 'integridadeFlora', label: 'Integridade flora', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'] },
  { id: 'exposicaoSolo', label: 'Exposição do solo', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'] },
];

function LavraSubterraneaCabecalhoTecnico({ form }: { form: any }) {
  const possuiVentilacao = form.watch('listagemA.lavraSubterranea.ventilacao.possuiSistema');
  const usaExplosivos = form.watch('listagemA.lavraSubterranea.processoProdutivo.usaExplosivos');
  const licencaExercito = form.watch('listagemA.lavraSubterranea.explosivos.possuiLicencaExercito');

  const { fields: materiaisConsumo, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'listagemA.lavraSubterranea.materiaisConsumo',
  });
  return (
    <div className="space-y-6">
      <PcaSectionCard title="27. Energia elétrica">
        <PcaNumField form={form} name="listagemA.lavraSubterranea.energiaEletrica.demandaMensalMwh" label="Demanda total mensal (MWh)" />
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.energiaEletrica.fontes"
          options={[
            { id: 'concessionaria', label: 'Fonte da concessionária local' },
            { id: 'gerador_diesel', label: 'Gerador – óleo diesel' },
            { id: 'gerador_gnl', label: 'Gerador – gás natural / GLP' },
            { id: 'usina_termo', label: 'Usina termelétrica' },
            { id: 'usina_hidro', label: 'Usina hidrelétrica' },
            { id: 'cogeracao', label: 'Usina de cogeração' },
            { id: 'eolica', label: 'Usina eólica' },
            { id: 'solar', label: 'Energia solar' },
            { id: 'subestacao', label: 'Subestação' },
            { id: 'linha_transmissao', label: 'Linhas de transmissão' },
            { id: 'outro', label: 'Outro' },
          ]}
        />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.energiaEletrica.detalhes" label="Detalhes das fontes, potências e usos" />
        <FormDescription>Anexo XXXIV – layout e medidas contra descargas elétricas.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="28. Caracterização geológica e geomorfológica">
        <PcaTextAreaField form={form} name="listagemA.lavraSubterranea.geologiaGeomorfologia.descricao" label="Descrição geológica e geomorfológica da área de influência" />
        <FormDescription>Anexo XXXV – mapa geológico e geomorfológico.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="29. Dados meteorológicos">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaTextField form={form} name="listagemA.lavraSubterranea.meteorologia.torreRegional" label="Torre regional – informações" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.meteorologia.torreLocal" label="Torre local – informações" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.meteorologia.ventosPeriodo" label="Ventos – período dos dados" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.meteorologia.ventosFonte" label="Ventos – fonte dos dados" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.meteorologia.temperaturaPeriodo" label="Temperatura – período dos dados" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.meteorologia.temperaturaFonte" label="Temperatura – fonte dos dados" />
        </div>
        <PcaTextAreaField form={form} name="listagemA.lavraSubterranea.meteorologia.pluviometria" label="Pluviometria – gráfico mensal e picos de chuva" />
      </PcaSectionCard>

      <PcaSectionCard title="30. Informações sobre a mina e corpo de minério">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="listagemA.lavraSubterranea.mina.tipoMinerio" label="Tipo de minério" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.mina.composicaoMinerio" label="Composição mineralógica do minério" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.mina.composicaoEsteril" label="Composição mineralógica do estéril" />
        </div>
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.mina.espessuraCorpo"
          options={[
            { id: 'muito_estreito', label: 'Muito estreito (<3 m)' },
            { id: 'estreito', label: 'Estreito (3–10 m)' },
            { id: 'intermediario', label: 'Intermediário (10–30 m)' },
            { id: 'espesso', label: 'Espesso (30–100 m)' },
            { id: 'muito_espesso', label: 'Muito espesso (>100 m)' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaTextField form={form} name="listagemA.lavraSubterranea.mina.inclinacaoCorpo" label="Inclinação do corpo de minério" />
          <PcaTextField form={form} name="listagemA.lavraSubterranea.mina.profundidadeCorpo" label="Profundidade do corpo a ser lavrado" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="31. Processo produtivo">
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.processoProdutivo.desmonte"
          options={[
            { id: 'manual', label: 'Desmonte manual' },
            { id: 'mecanico', label: 'Desmonte mecânico' },
          ]}
        />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.ferramentasManuais" label="Ferramentas manuais utilizadas" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.maquinasEquipamentos" label="Máquinas e equipamentos mecânicos" />
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.processoProdutivo.usaExplosivos" label="Uso de explosivos" />
        {usaExplosivos && (
          <PcaTextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.planoFogo" label="Tipos de explosivo e plano de fogo (Eng. de Minas)" />
        )}
        <PcaNumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.volumeEsterilDiaM3" label="Volume de estéril gerado por dia (m³)" />
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.processoProdutivo.destinacaoEsteril"
          options={[
            { id: 'pilha', label: 'Disposição em pilha de estéril' },
            { id: 'enchimento', label: 'Uso como enchimento de mina' },
            { id: 'outros', label: 'Outros destinos' },
          ]}
        />
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.processoProdutivo.classificacaoEsteril"
          options={[
            { id: 'classe_2a', label: 'Classe 2A – não perigoso e não inerte (Anexo XXXVI)' },
            { id: 'classe_2b', label: 'Classe 2B – inerte' },
          ]}
        />
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.processoProdutivo.potencialAguaAcida" label="O estéril possui potencial gerador de água ácida?" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.pilhaIdentificacao" label="Pilha – identificação" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.pilhaVolumeFinalM3" label="Volume final pilha (m³)" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.pilhaAlturaM" label="Altura total da pilha (m)" />
        </div>
        <PcaCheckboxOptions form={form} name="listagemA.lavraSubterranea.processoProdutivo.metodologias" options={metodologiasLavra} />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.descricaoMetodo" label="Descrição sumária do método de lavra" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.volumeMinerioDiaM3" label="Volume de minério gerado por dia (m³)" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.indiceRecuperacaoPercent" label="Índice de recuperação na lavra (%)" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.rejeitosDiaM3" label="Rejeitos gerados na lavra (m³/dia ou mês)" />
        </div>
        {materiaisConsumo.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.tipo`} label="Material" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.descricao`} label="Descrição" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.consumoMensal`} label="Consumo mensal" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.acondicionamento`} label="Acondicionamento" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.armazenamento`} label="Armazenamento" />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMaterial({ tipo: '', descricao: '', consumoMensal: '', acondicionamento: '', armazenamento: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar material de consumo
        </Button>
        <FormDescription>Anexos XXXIX (fechamento de mina) e XL (explosivos e plano de fogo).</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="32. Sistema de ventilação">
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.ventilacao.possuiSistema" label="A mina será/está dotada de sistema de ventilação?" />
        {possuiVentilacao ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaNumField form={form} name="listagemA.lavraSubterranea.ventilacao.potenciaExaustorMw" label="Potência do exaustor (MW)" />
            <PcaNumField form={form} name="listagemA.lavraSubterranea.ventilacao.vazaoExaustaoNm3h" label="Vazão da exaustão (Nm³/h)" />
            <FormDescription className="md:col-span-2">Anexo XLIII – projeto da ventilação.</FormDescription>
          </div>
        ) : (
          <FormDescription>Anexo XLIV – medidas para controle da qualidade do ar na mina.</FormDescription>
        )}
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.ventilacao.condicoesAr"
          options={[
            { id: 'poeira', label: 'Poeira da lavra e desmonte' },
            { id: 'gases_veiculares', label: 'Gases veiculares' },
            { id: 'gases_detonacao', label: 'Gases das detonações' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaCheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.ventilacao.controlesInternos"
          options={[
            { id: 'caminhao_pipa', label: 'Caminhão pipa' },
            { id: 'pavimentacao', label: 'Pavimentação das vias internas' },
            { id: 'aspersao_gases', label: 'Abatimento de gases por aspersão de água' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
      </PcaSectionCard>

      <PcaSectionCard title="33. Desaguamento e explosivos">
        <PcaTextField form={form} name="listagemA.lavraSubterranea.desaguamento.descricao" label="Sistema de desaguamento da mina" />
        <FormDescription>Anexos XLV (monitoramento do lençol), XLVI (hidrogeologia) e XLVII (projeto de desaguamento).</FormDescription>
        <PcaTextField form={form} name="listagemA.lavraSubterranea.explosivos.blasterResponsavel" label="Blaster responsável" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.explosivos.regimeHorarioDetonacoes" label="Regime e horário das detonações" />
        <PcaTextAreaField form={form} name="listagemA.lavraSubterranea.explosivos.preparacao" label="Preparação dos explosivos" />
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.explosivos.possuiLicencaExercito" label="Possui licença do Exército?" />
        {licencaExercito ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaTextField form={form} name="listagemA.lavraSubterranea.explosivos.validadeLicenca" label="Data de validade" />
            <PcaTextField form={form} name="listagemA.lavraSubterranea.explosivos.numeroLicenca" label="Nº da licença" />
          </div>
        ) : (
          <FormDescription>Anexo XLI – protocolo de solicitação de licença.</FormDescription>
        )}
        <FormDescription>Anexo XLII – projeto do paiol de explosivos.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="34. Beneficiamento – equipamentos ou sistemas utilizados">
        <FormDescription>
          Processos com transformação química (calcinação, lixiviação etc.) pertencem à Listagem B.
        </FormDescription>
        {processosBeneficiamento.map((proc) => (
          <div key={proc.id} className="space-y-2 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.ativo`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  </FormControl>
                  <FormLabel>{proc.label}</FormLabel>
                </FormItem>
              )}
            />
            {form.watch(`listagemA.lavraSubterranea.beneficiamento.${proc.id}.ativo`) && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PcaTextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.equipamento`} label="Equipamento" />
                <PcaTextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.descricao`} label="Descrição" />
                <PcaTextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.capacidade`} label="Capacidade máxima de produção" />
                <PcaTextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.tempoOperacao`} label="Tempo médio de operação (h/dia)" />
                <PcaTextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.impactos`} label="Impactos" />
                <PcaTextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.medidasControle`} label="Medidas de controle" />
              </div>
            )}
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="35. Relação de matérias-primas e insumos">
        <PcaTabelaLinhasFixas
          form={form}
          basePath="listagemA.lavraSubterranea.materiasPrimas"
          linhas={[
            { id: 'linha1', label: 'Item 1' },
            { id: 'linha2', label: 'Item 2' },
            { id: 'linha3', label: 'Item 3' },
            { id: 'linha4', label: 'Item 4' },
          ]}
          colunas={[
            { key: 'nome', label: 'Nome' },
            { key: 'identificacao', label: 'Identificação técnica' },
            { key: 'embalagem', label: 'Embalagem' },
            { key: 'armazenamento', label: 'Armazenamento' },
            { key: 'consumoMaximo', label: 'Consumo máx. mensal' },
            { key: 'consumoMedio', label: 'Consumo médio mensal' },
          ]}
        />
      </PcaSectionCard>

      <PcaSectionCard title="36. Fluxograma do processo">
        <FormDescription>
          Anexo XLVIII – fluxograma com entradas (matérias-primas, reagentes, água) e saídas (efluentes, emissões, resíduos), distinguindo atividades dentro e fora da mina.
        </FormDescription>
        <PcaTextField form={form} name="listagemA.lavraSubterranea.fluxograma.observacoes" label="Observações sobre o fluxograma" />
      </PcaSectionCard>

    </div>
  );
}

function LavraSubterraneaImpactosMonitoramento({ form }: { form: any }) {
  const { fields: pontosMonitoramento, append: appendPonto, remove: removePonto } = useFieldArray({
    control: form.control,
    name: 'listagemA.lavraSubterranea.monitoramentoHidrico.pontos',
  });
  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: 'listagemA.lavraSubterranea.zeeSocioeconomico',
  });
  const trAbordouImpactos = form.watch('listagemA.lavraSubterranea.outrosImpactos.trAbordouTodos');

  return (
    <div className="space-y-6">
      <PcaSectionCard title="54. Emissões previstas – fase de implantação">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaNumField form={form} name="listagemA.lavraSubterranea.implantacao.funcionariosTemporarios" label="Nº funcionários temporários previstos" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.implantacao.equipamentosPesados" label="Nº equipamentos pesados previstos" />
        </div>
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.implantacao.canteiroObras" label="Haverá canteiro de obras no local?" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.implantacao.controleRuido" label="Controle de ruído na implantação" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.implantacao.controlePoeira" label="Controle de poeira na implantação" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.implantacao.efluentesOleosos" label="Efluentes oleosos na fase de obras" />
      </PcaSectionCard>

      <PcaSectionCard title="55. Resíduos sólidos – fase de implantação">
        <PcaTabelaLinhasFixas
          form={form}
          basePath="listagemA.lavraSubterranea.residuosImplantacao"
          linhas={[
            { id: 'papel', label: 'Papel' },
            { id: 'sucata', label: 'Sucata' },
            { id: 'borracha', label: 'Borracha' },
            { id: 'plasticos', label: 'Plásticos' },
            { id: 'contaminados_oleo', label: 'Contaminados com óleo' },
            { id: 'outros', label: 'Outros' },
          ]}
          colunas={[
            { key: 'classe', label: 'Classe' },
            { key: 'destino', label: 'Destinação final' },
            { key: 'transporte', label: 'Empresa transporte' },
            { key: 'destinacao', label: 'Empresa destinação' },
            { key: 'cnpj', label: 'CNPJ' },
          ]}
        />
      </PcaSectionCard>

      <PcaSectionCard title="56. Pontos de monitoramento hídrico (background)">
        {pontosMonitoramento.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.codigo`} label="Código" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.tipo`} label="Tipo de ponto" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.utm`} label="UTM (X, Y, Z)" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.frequencia`} label="Frequência" />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removePonto(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendPonto({ codigo: '', tipo: '', descricao: '', utm: '', frequencia: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar ponto de monitoramento
        </Button>
        <FormDescription>Anexo LIII – localização dos pontos de monitoramento hídrico.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="60 a 63. Possíveis impactos ambientais">
        <PcaCheckboxOptions form={form} name="listagemA.lavraSubterranea.impactos.meioFisico" options={impactosMeioFisico.map((i) => ({ id: i, label: i }))} />
        <PcaCheckboxOptions form={form} name="listagemA.lavraSubterranea.impactos.meioBiotico" options={impactosMeioBiotico.map((i) => ({ id: i, label: i }))} />
        <PcaCheckboxOptions form={form} name="listagemA.lavraSubterranea.impactos.meioSocioeconomico" options={impactosMeioSocioeconomico.map((i) => ({ id: i, label: i }))} />
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.outrosImpactos.trAbordouTodos" label="Este TR abordou todos os possíveis impactos negativos?" />
        {!trAbordouImpactos && (
          <PcaTextAreaField form={form} name="listagemA.lavraSubterranea.outrosImpactos.descricao" label="Impactos não abordados anteriormente" />
        )}
        <FormDescription>Anexos LVI (impactos) e LVII (medidas mitigadoras).</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="65. Componente geofísico e biótico (ZEE)">
        {zeeGeofisicoLavra.map((item) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name={`listagemA.lavraSubterranea.zeeGeofisico.${item.id}.classificacao`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{item.label}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder={item.options.join(' / ')} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <PcaNumField form={form} name={`listagemA.lavraSubterranea.zeeGeofisico.${item.id}.percentual`} label="Distribuição (%)" />
          </div>
        ))}
        <FormDescription>Anexo LVIII – justificativas quando indicadores ZEE forem desfavoráveis.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="66. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.populacao`} label="População" />
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.saude`} label="Saúde" />
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.educacao`} label="Educação" />
              <PcaTextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMunicipio({ municipio: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar município
        </Button>
      </PcaSectionCard>
    </div>
  );
}

export function PcaFormListagemALavraTecnico({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <LavraSubterraneaCabecalhoTecnico form={form} />
      <PcaFormListagemATecnicoSecoes form={form} parte="37-53" />
      <LavraSubterraneaImpactosMonitoramento form={form} />
      <PcaFormListagemATecnicoSecoes form={form} parte="57-59" />
    </div>
  );
}
