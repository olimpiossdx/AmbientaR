'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { CoordinateStringFormField } from '@/components/coordinates';
import {
  BooleanRadio,
  CheckboxOptions,
  NumField,
  SectionCard,
  TextField,
  TabelaLinhasFixas,
} from './form-listagem-a-helpers';
import { FormListagemATecnico } from './form-listagem-a-tecnico';

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
      <SectionCard title="27. Energia elétrica">
        <NumField form={form} name="listagemA.lavraSubterranea.energiaEletrica.demandaMensalMwh" label="Demanda total mensal (MWh)" />
        <CheckboxOptions
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
        <TextField form={form} name="listagemA.lavraSubterranea.energiaEletrica.detalhes" label="Detalhes das fontes, potências e usos" />
        <FormDescription>Anexo XXXIV – layout e medidas contra descargas elétricas.</FormDescription>
      </SectionCard>

      <SectionCard title="28. Caracterização geológica e geomorfológica">
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.geologiaGeomorfologia.descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição geológica e geomorfológica da área de influência</FormLabel>
              <FormControl>
                <Textarea rows={5} placeholder="Geologia local, litologias, solos, estabilidade de taludes, formas de relevo, suscetibilidade erosiva..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription>Anexo XXXV – mapa geológico e geomorfológico.</FormDescription>
      </SectionCard>

      <SectionCard title="29. Dados meteorológicos">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField form={form} name="listagemA.lavraSubterranea.meteorologia.torreRegional" label="Torre regional – informações" />
          <TextField form={form} name="listagemA.lavraSubterranea.meteorologia.torreLocal" label="Torre local – informações" />
          <TextField form={form} name="listagemA.lavraSubterranea.meteorologia.ventosPeriodo" label="Ventos – período dos dados" />
          <TextField form={form} name="listagemA.lavraSubterranea.meteorologia.ventosFonte" label="Ventos – fonte dos dados" />
          <TextField form={form} name="listagemA.lavraSubterranea.meteorologia.temperaturaPeriodo" label="Temperatura – período dos dados" />
          <TextField form={form} name="listagemA.lavraSubterranea.meteorologia.temperaturaFonte" label="Temperatura – fonte dos dados" />
        </div>
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.meteorologia.pluviometria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pluviometria – gráfico mensal e picos de chuva</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="30. Informações sobre a mina e corpo de minério">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField form={form} name="listagemA.lavraSubterranea.mina.tipoMinerio" label="Tipo de minério" />
          <TextField form={form} name="listagemA.lavraSubterranea.mina.composicaoMinerio" label="Composição mineralógica do minério" />
          <TextField form={form} name="listagemA.lavraSubterranea.mina.composicaoEsteril" label="Composição mineralógica do estéril" />
        </div>
        <CheckboxOptions
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
          <TextField form={form} name="listagemA.lavraSubterranea.mina.inclinacaoCorpo" label="Inclinação do corpo de minério" />
          <TextField form={form} name="listagemA.lavraSubterranea.mina.profundidadeCorpo" label="Profundidade do corpo a ser lavrado" />
        </div>
      </SectionCard>

      <SectionCard title="31. Processo produtivo">
        <CheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.processoProdutivo.desmonte"
          options={[
            { id: 'manual', label: 'Desmonte manual' },
            { id: 'mecanico', label: 'Desmonte mecânico' },
          ]}
        />
        <TextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.ferramentasManuais" label="Ferramentas manuais utilizadas" />
        <TextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.maquinasEquipamentos" label="Máquinas e equipamentos mecânicos" />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.processoProdutivo.usaExplosivos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uso de explosivos</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaExplosivos && (
          <TextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.planoFogo" label="Tipos de explosivo e plano de fogo (Eng. de Minas)" />
        )}
        <NumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.volumeEsterilDiaM3" label="Volume de estéril gerado por dia (m³)" />
        <CheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.processoProdutivo.destinacaoEsteril"
          options={[
            { id: 'pilha', label: 'Disposição em pilha de estéril' },
            { id: 'enchimento', label: 'Uso como enchimento de mina' },
            { id: 'outros', label: 'Outros destinos' },
          ]}
        />
        <CheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.processoProdutivo.classificacaoEsteril"
          options={[
            { id: 'classe_2a', label: 'Classe 2A – não perigoso e não inerte (Anexo XXXVI)' },
            { id: 'classe_2b', label: 'Classe 2B – inerte' },
          ]}
        />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.processoProdutivo.potencialAguaAcida"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O estéril possui potencial gerador de água ácida?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.pilhaIdentificacao" label="Pilha – identificação" />
          <NumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.pilhaVolumeFinalM3" label="Volume final pilha (m³)" />
          <NumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.pilhaAlturaM" label="Altura total da pilha (m)" />
        </div>
        <CheckboxOptions form={form} name="listagemA.lavraSubterranea.processoProdutivo.metodologias" options={metodologiasLavra} />
        <TextField form={form} name="listagemA.lavraSubterranea.processoProdutivo.descricaoMetodo" label="Descrição sumária do método de lavra" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.volumeMinerioDiaM3" label="Volume de minério gerado por dia (m³)" />
          <NumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.indiceRecuperacaoPercent" label="Índice de recuperação na lavra (%)" />
          <NumField form={form} name="listagemA.lavraSubterranea.processoProdutivo.rejeitosDiaM3" label="Rejeitos gerados na lavra (m³/dia ou mês)" />
        </div>
        {materiaisConsumo.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.tipo`} label="Material" />
            <TextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.descricao`} label="Descrição" />
            <TextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.consumoMensal`} label="Consumo mensal" />
            <TextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.acondicionamento`} label="Acondicionamento" />
            <TextField form={form} name={`listagemA.lavraSubterranea.materiaisConsumo.${index}.armazenamento`} label="Armazenamento" />
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
      </SectionCard>

      <SectionCard title="32. Sistema de ventilação">
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.ventilacao.possuiSistema"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A mina será/está dotada de sistema de ventilação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {possuiVentilacao ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NumField form={form} name="listagemA.lavraSubterranea.ventilacao.potenciaExaustorMw" label="Potência do exaustor (MW)" />
            <NumField form={form} name="listagemA.lavraSubterranea.ventilacao.vazaoExaustaoNm3h" label="Vazão da exaustão (Nm³/h)" />
            <FormDescription className="md:col-span-2">Anexo XLIII – projeto da ventilação.</FormDescription>
          </div>
        ) : (
          <FormDescription>Anexo XLIV – medidas para controle da qualidade do ar na mina.</FormDescription>
        )}
        <CheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.ventilacao.condicoesAr"
          options={[
            { id: 'poeira', label: 'Poeira da lavra e desmonte' },
            { id: 'gases_veiculares', label: 'Gases veiculares' },
            { id: 'gases_detonacao', label: 'Gases das detonações' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <CheckboxOptions
          form={form}
          name="listagemA.lavraSubterranea.ventilacao.controlesInternos"
          options={[
            { id: 'caminhao_pipa', label: 'Caminhão pipa' },
            { id: 'pavimentacao', label: 'Pavimentação das vias internas' },
            { id: 'aspersao_gases', label: 'Abatimento de gases por aspersão de água' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
      </SectionCard>

      <SectionCard title="33. Desaguamento e explosivos">
        <TextField form={form} name="listagemA.lavraSubterranea.desaguamento.descricao" label="Sistema de desaguamento da mina" />
        <FormDescription>Anexos XLV (monitoramento do lençol), XLVI (hidrogeologia) e XLVII (projeto de desaguamento).</FormDescription>
        <TextField form={form} name="listagemA.lavraSubterranea.explosivos.blasterResponsavel" label="Blaster responsável" />
        <TextField form={form} name="listagemA.lavraSubterranea.explosivos.regimeHorarioDetonacoes" label="Regime e horário das detonações" />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.explosivos.preparacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preparação dos explosivos</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.explosivos.possuiLicencaExercito"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui licença do Exército?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {licencaExercito ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField form={form} name="listagemA.lavraSubterranea.explosivos.validadeLicenca" label="Data de validade" />
            <TextField form={form} name="listagemA.lavraSubterranea.explosivos.numeroLicenca" label="Nº da licença" />
          </div>
        ) : (
          <FormDescription>Anexo XLI – protocolo de solicitação de licença.</FormDescription>
        )}
        <FormDescription>Anexo XLII – projeto do paiol de explosivos.</FormDescription>
      </SectionCard>

      <SectionCard title="34. Beneficiamento – equipamentos ou sistemas utilizados">
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
                <TextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.equipamento`} label="Equipamento" />
                <TextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.descricao`} label="Descrição" />
                <TextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.capacidade`} label="Capacidade máxima de produção" />
                <TextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.tempoOperacao`} label="Tempo médio de operação (h/dia)" />
                <TextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.impactos`} label="Impactos" />
                <TextField form={form} name={`listagemA.lavraSubterranea.beneficiamento.${proc.id}.medidasControle`} label="Medidas de controle" />
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      <SectionCard title="35. Relação de matérias-primas e insumos">
        <TabelaLinhasFixas
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
      </SectionCard>

      <SectionCard title="36. Fluxograma do processo">
        <FormDescription>
          Anexo XLVIII – fluxograma com entradas (matérias-primas, reagentes, água) e saídas (efluentes, emissões, resíduos), distinguindo atividades dentro e fora da mina.
        </FormDescription>
        <TextField form={form} name="listagemA.lavraSubterranea.fluxograma.observacoes" label="Observações sobre o fluxograma" />
      </SectionCard>

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
      <SectionCard title="54. Emissões previstas – fase de implantação">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField form={form} name="listagemA.lavraSubterranea.implantacao.funcionariosTemporarios" label="Nº funcionários temporários previstos" />
          <NumField form={form} name="listagemA.lavraSubterranea.implantacao.equipamentosPesados" label="Nº equipamentos pesados previstos" />
        </div>
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.implantacao.canteiroObras"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haverá canteiro de obras no local?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemA.lavraSubterranea.implantacao.controleRuido" label="Controle de ruído na implantação" />
        <TextField form={form} name="listagemA.lavraSubterranea.implantacao.controlePoeira" label="Controle de poeira na implantação" />
        <TextField form={form} name="listagemA.lavraSubterranea.implantacao.efluentesOleosos" label="Efluentes oleosos na fase de obras" />
      </SectionCard>

      <SectionCard title="55. Resíduos sólidos – fase de implantação">
        <TabelaLinhasFixas
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
      </SectionCard>

      <SectionCard title="56. Pontos de monitoramento hídrico (background)">
        {pontosMonitoramento.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <TextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.codigo`} label="Código" />
            <TextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.tipo`} label="Tipo de ponto" />
            <TextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <TextField form={form} name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.frequencia`} label="Frequência" />
            <CoordinateStringFormField
              form={form}
              name={`listagemA.lavraSubterranea.monitoramentoHidrico.pontos.${index}.utm`}
              label="Coordenadas UTM (SIRGAS 2000)"
              className="md:col-span-6"
            />
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
      </SectionCard>

      <SectionCard title="60 a 63. Possíveis impactos ambientais">
        <CheckboxOptions form={form} name="listagemA.lavraSubterranea.impactos.meioFisico" options={impactosMeioFisico.map((i) => ({ id: i, label: i }))} />
        <CheckboxOptions form={form} name="listagemA.lavraSubterranea.impactos.meioBiotico" options={impactosMeioBiotico.map((i) => ({ id: i, label: i }))} />
        <CheckboxOptions form={form} name="listagemA.lavraSubterranea.impactos.meioSocioeconomico" options={impactosMeioSocioeconomico.map((i) => ({ id: i, label: i }))} />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.outrosImpactos.trAbordouTodos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Este TR abordou todos os possíveis impactos negativos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {!trAbordouImpactos && (
          <FormField
            control={form.control}
            name="listagemA.lavraSubterranea.outrosImpactos.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impactos não abordados anteriormente</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormDescription>Anexos LVI (impactos) e LVII (medidas mitigadoras).</FormDescription>
      </SectionCard>

      <SectionCard title="65. Componente geofísico e biótico (ZEE)">
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
            <NumField form={form} name={`listagemA.lavraSubterranea.zeeGeofisico.${item.id}.percentual`} label="Distribuição (%)" />
          </div>
        ))}
        <FormDescription>Anexo LVIII – justificativas quando indicadores ZEE forem desfavoráveis.</FormDescription>
      </SectionCard>

      <SectionCard title="66. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.populacao`} label="População" />
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.saude`} label="Saúde" />
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.educacao`} label="Educação" />
              <TextField form={form} name={`listagemA.lavraSubterranea.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMunicipio({ municipio: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar município
        </Button>
      </SectionCard>
    </div>
  );
}

export function FormListagemALavraSubterraneaTecnico({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <LavraSubterraneaCabecalhoTecnico form={form} />
      <FormListagemATecnico form={form} parte="37-53" />
      <LavraSubterraneaImpactosMonitoramento form={form} />
      <FormListagemATecnico form={form} parte="57-59" />
    </div>
  );
}
