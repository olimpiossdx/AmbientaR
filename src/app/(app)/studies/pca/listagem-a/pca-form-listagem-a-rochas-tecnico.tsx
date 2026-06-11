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

const base = 'listagemA.rochasOrnamentais';

const finalidadesAgua = [
  'Lavagem de matéria-prima',
  'Lavagem de produto intermediário',
  'Lavagem de veículos',
  'Controle de emissões atmosféricas',
  'Lavagem de pisos e equipamentos',
  'Consumo humano',
  'Outras finalidades',
];

const tiposCorte = [
  { id: 'cunhas_metalicas', label: 'Perfuração para cunhas metálicas' },
  { id: 'mortero_expansivo', label: 'Perfuração para morteiro expansivo' },
  { id: 'explosivo', label: 'Perfuração para corte explosivo' },
  { id: 'fio_diamantado', label: 'Corte contínuo – fio diamantado' },
  { id: 'serra_circular', label: 'Corte contínuo – serras circulares' },
  { id: 'jet_flame', label: 'Jet flame' },
  { id: 'desmonte_manual', label: 'Desmonte manual' },
  { id: 'outros', label: 'Outros' },
];

const fontesRuido = [
  'Serras circulares',
  'Detonações',
  'Compressores',
  'Perfurações',
  'Beneficiamento',
  'Outros',
];

const tiposEfluente = [
  'Óleos e graxas',
  'Águas de lavagem',
  'Efluentes de corte contínuo',
  'Efluentes da unidade de beneficiamento',
  'Efluentes sanitários',
  'Outros',
];

const tiposResiduo = [
  'Papel / plástico / vidro',
  'Sucata metálica',
  'Pneus',
  'Contaminados com óleo',
  'Outros',
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
  'Contaminação por esgoto',
  'Intervenção em nascentes',
  'Emissão de material particulado',
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

const zeeGeofisico = [
  'Potencialidade social',
  'Vulnerabilidade natural',
  'Vulnerabilidade de contaminação do solo',
  'Taxa de decomposição de matéria orgânica do solo',
  'Vulnerabilidade à erosão',
  'Risco ambiental',
  'Qualidade ambiental',
  'Qualidade da água superficial',
  'Vulnerabilidade associada à disponibilidade de água superficial',
  'Integridade fauna',
  'Integridade flora',
  'Exposição do solo',
];

export function PcaFormListagemARochasTecnico({ form }: { form: any }) {
  const usaExplosivos = form.watch(`${base}.processoProdutivo.usaExplosivos`);
  const haDetonacoes = form.watch(`${base}.emissoes.haveraDetonacoes`);
  const beneficiamentoSerraria = form.watch(`${base}.beneficiamento.haBeneficiamentoSerraria`);
  const { fields: equipamentos, append: appendEquip, remove: removeEquip } = useFieldArray({
    control: form.control,
    name: `${base}.equipamentos`,
  });
  const { fields: insumosBeneficiamento, append: appendInsumo, remove: removeInsumo } = useFieldArray({
    control: form.control,
    name: `${base}.insumosBeneficiamento`,
  });
  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: `${base}.zeeSocioeconomico`,
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="18. Dados econômicos do empreendimento">
        <PcaBooleanRadio form={form} name={`${base}.dadosEconomicos.investimentoAmbiental`} label="Estimativa de investimento ambiental?" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaTextField form={form} name={`${base}.dadosEconomicos.tipoAplicacaoInvestimento`} label="Tipo de aplicação do investimento" />
          <PcaNumField form={form} name={`${base}.dadosEconomicos.investimentoAmbientalRsAno`} label="Investimento ambiental (R$/ano)" />
          <PcaNumField form={form} name={`${base}.dadosEconomicos.arrecadacaoCfemRsAno`} label="Arrecadação CFEM estimada (R$/ano)" />
          <PcaNumField form={form} name={`${base}.dadosEconomicos.custoImplantacaoRsAno`} label="Custo estimado de implantação (R$/ano)" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="19. Recursos humanos (setores)">
        <PcaTabelaLinhasFixas
          form={form}
          basePath={`${base}.recursosHumanos`}
          linhas={[
            { id: 'producao', label: 'Setor de produção' },
            { id: 'administrativo', label: 'Setor administrativo' },
            { id: 'manutencao', label: 'Setor de manutenção' },
          ]}
          colunas={[
            { key: 'quantidade', label: 'Nº funcionários', type: 'number' },
            { key: 'pctMunicipio', label: '% município próprio' },
            { key: 'pctOutrosMg', label: '% outros MG' },
            { key: 'pctOutrosEstados', label: '% outros estados' },
          ]}
        />
      </PcaSectionCard>

      <PcaSectionCard title="20. Implantação de infra-estrutura">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <PcaTextField form={form} name={`${base}.infraestrutura.acessosExtensao`} label="Acessos – extensão" />
          <PcaTextField form={form} name={`${base}.infraestrutura.acessosTipoObra`} label="Tipo de obra" />
          <PcaTextField form={form} name={`${base}.infraestrutura.acessosConservacao`} label="Estado de conservação" />
          <PcaTextField form={form} name={`${base}.infraestrutura.acessosPavimentacao`} label="Tipo de pavimentação" />
        </div>
        <PcaTextAreaField
          form={form}
          name={`${base}.infraestrutura.descricaoAcessos`}
          label="Acessos e fluxo de produção – obras, impactos e controles"
        />
        <PcaTextAreaField form={form} name={`${base}.infraestrutura.preparoAreas`} label="Preparo das áreas de exploração e apoios" />
        <PcaTextAreaField form={form} name={`${base}.infraestrutura.energiaEletrica`} label="Energia elétrica – fonte, rede e impactos" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name={`${base}.infraestrutura.fonteEnergia`} label="Fonte / concessionária" />
          <PcaNumField form={form} name={`${base}.infraestrutura.consumoEnergiaMensal`} label="Consumo médio mensal" />
        </div>
        <PcaTextAreaField form={form} name={`${base}.infraestrutura.abastecimentoAgua`} label="Abastecimento de água – obras e impactos" />
        <PcaTextAreaField form={form} name={`${base}.infraestrutura.edificacoes`} label="Construção das edificações (escritórios, oficinas, almoxarifado etc.)" />
      </PcaSectionCard>

      <PcaSectionCard title="21. Uso de água">
        <FormDescription>Balanço hídrico – consumo por finalidade (m³/dia)</FormDescription>
        {finalidadesAgua.map((finalidade) => {
          const slug = finalidade.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
              <p className="font-medium md:col-span-1">{finalidade}</p>
              <PcaNumField form={form} name={`${base}.usoAgua.finalidades.${slug}.maximo`} label="Consumo máx. diário" />
              <PcaNumField form={form} name={`${base}.usoAgua.finalidades.${slug}.medio`} label="Consumo méd. diário" />
            </div>
          );
        })}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name={`${base}.usoAgua.volumeReuso`} label="Volume de reuso (m³/dia)" />
          <PcaNumField form={form} name={`${base}.usoAgua.consumoTotalMaximo`} label="Consumo total máximo diário" />
          <PcaNumField form={form} name={`${base}.usoAgua.consumoTotalMedio`} label="Consumo total médio diário" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="22. Processo produtivo – estéril e rejeitos">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.processoProdutivo.desmonte`}
          options={[
            { id: 'manual', label: 'Desmonte manual' },
            { id: 'mecanico', label: 'Desmonte mecânico' },
          ]}
        />
        <PcaTextField form={form} name={`${base}.processoProdutivo.ferramentasManuais`} label="Ferramentas manuais" />
        <PcaTextField form={form} name={`${base}.processoProdutivo.maquinasEquipamentos`} label="Máquinas e equipamentos" />
        <PcaTextAreaField form={form} name={`${base}.processoProdutivo.usaExplosivos`} label="Uso de explosivos" />
        {usaExplosivos && (
          <PcaTextField form={form} name={`${base}.processoProdutivo.planoFogo`} label="Tipos de explosivo e plano de fogo (Anexo 8)" />
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name={`${base}.processoProdutivo.capeamentoEspessuraM`} label="Capeamento – espessura (m)" />
          <PcaNumField form={form} name={`${base}.processoProdutivo.capeamentoVolumeM3`} label="Capeamento – volume (m³)" />
          <PcaTextField form={form} name={`${base}.processoProdutivo.capeamentoComposicao`} label="Capeamento – composição" />
        </div>
        <PcaBooleanRadio form={form} name={`${base}.processoProdutivo.armazenamentoEsteril`} label="Armazenamento/disposição de estéril e rejeitos" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name={`${base}.processoProdutivo.pilhaVolumeFinalM3`} label="Pilha – volume final (m³)" />
          <PcaNumField form={form} name={`${base}.processoProdutivo.pilhaAlturaM`} label="Altura total da pilha (m)" />
          <PcaNumField form={form} name={`${base}.processoProdutivo.pilhaAreaM2`} label="Área final projetada (m²)" />
        </div>
        <PcaTextAreaField form={form} name={`${base}.processoProdutivo.usaAguaProcesso`} label="Utilização de água no processo?" />
      </PcaSectionCard>

      <PcaSectionCard title="23. Extração de rocha">
        <PcaBooleanRadio form={form} name={`${base}.extracaoRocha.metodologia`} label="Metodologia de extração (bancadas, perfuração, equipamentos)" />
        <PcaCheckboxOptions form={form} name={`${base}.extracaoRocha.tiposCorte`} options={tiposCorte} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaNumField form={form} name={`${base}.extracaoRocha.indiceRecuperacaoPercent`} label="Índice de recuperação na lavra (%)" />
          <PcaNumField form={form} name={`${base}.extracaoRocha.rejeitosDiaM3`} label="Volume diário/mensal de rejeitos (m³)" />
        </div>
        {equipamentos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <PcaTextField form={form} name={`${base}.equipamentos.${index}.descricao`} label="Equipamento" />
            <PcaTextField form={form} name={`${base}.equipamentos.${index}.tipo`} label="Tipo" />
            <PcaTextField form={form} name={`${base}.equipamentos.${index}.quantidade`} label="Quantidade" />
            <PcaTextField form={form} name={`${base}.equipamentos.${index}.capacidade`} label="Capacidade máxima" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeEquip(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendEquip({ descricao: '', tipo: '', quantidade: '', capacidade: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
        </Button>
        <PcaTextAreaField form={form} name={`${base}.explosivos.preparacao`} label="Preparação dos explosivos / blaster / licença do Exército" />
      </PcaSectionCard>

      <PcaSectionCard title="24. Beneficiamento">
        <PcaTextAreaField form={form} name={`${base}.beneficiamento.primarioAreasLavra`} label="Beneficiamento primário nas áreas de lavra?" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaNumField form={form} name={`${base}.beneficiamento.indiceRecuperacaoFinalPercent`} label="Índice final de recuperação (lavra + beneficiamento) %" />
          <PcaNumField form={form} name={`${base}.beneficiamento.rejeitosMensaisM3`} label="Volume mensal de rejeitos (m³)" />
        </div>
        <PcaBooleanRadio form={form} name={`${base}.beneficiamento.alternativasRejeito`} label="Alternativas técnicas/econômicas para utilização de rejeitos" />
        <PcaTextAreaField form={form} name={`${base}.beneficiamento.haBeneficiamentoSerraria`} label="Haverá beneficiamento (serrarias) no polígono minerário?" />
        {beneficiamentoSerraria && (
          <>
            <PcaBooleanRadio form={form} name={`${base}.beneficiamento.usaAguaBeneficiamento`} label="Utilização de água no beneficiamento?" />
            <PcaBooleanRadio form={form} name={`${base}.beneficiamento.reaproveitamentoAgua`} label="Reaproveitamento de água no beneficiamento?" />
            <PcaTextField form={form} name={`${base}.beneficiamento.areaServidaoDnpm`} label="Em área de servidão DNPM?" />
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="25. Insumos utilizados no beneficiamento">
        {insumosBeneficiamento.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <PcaTextField form={form} name={`${base}.insumosBeneficiamento.${index}.descricao`} label="Descrição" />
            <PcaTextField form={form} name={`${base}.insumosBeneficiamento.${index}.tipo`} label="Tipo" />
            <PcaTextField form={form} name={`${base}.insumosBeneficiamento.${index}.consumoMensal`} label="Consumo mensal" />
            <PcaTextField form={form} name={`${base}.insumosBeneficiamento.${index}.processo`} label="Processo" />
            <PcaTextField form={form} name={`${base}.insumosBeneficiamento.${index}.fabricante`} label="Fabricante" />
            <PcaTextField form={form} name={`${base}.insumosBeneficiamento.${index}.ondeUtilizado`} label="Onde é utilizado" />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeInsumo(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendInsumo({ descricao: '', tipo: '', consumoMensal: '', processo: '', fabricante: '', ondeUtilizado: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar insumo
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="26. Caracterização das emissões">
        <FormDescription>Ruídos – fontes, periodicidade e intensidade (dB)</FormDescription>
        {fontesRuido.map((fonte) => {
          const slug = fonte.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium">{fonte}</p>
              <PcaTextField form={form} name={`${base}.emissoes.ruidos.${slug}.periodicidade`} label="Periodicidade" />
              <PcaNumField form={form} name={`${base}.emissoes.ruidos.${slug}.intensidadeDb`} label="Intensidade (dB)" />
              <PcaBooleanRadio form={form} name={`${base}.emissoes.ruidos.${slug}.incidencia`} label="Incidência?" />
            </div>
          );
        })}
        <PcaBooleanRadio form={form} name={`${base}.emissoes.haveraDetonacoes`} label="Haverá detonações?" />
        {haDetonacoes && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaTextField form={form} name={`${base}.emissoes.frequenciaDetonacoes`} label="Frequência das detonações" />
            <PcaTextField form={form} name={`${base}.emissoes.horarioDetonacoes`} label="Horário fixo para detonações" />
          </div>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="27. Efluentes líquidos">
        {tiposEfluente.map((tipo) => {
          const slug = tipo.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium">{tipo}</p>
              <PcaTextField form={form} name={`${base}.efluentes.${slug}.fontes`} label="Fontes geradoras" />
              <PcaBooleanRadio form={form} name={`${base}.efluentes.${slug}.possuiTratamento`} label="Sistema de tratamento?" />
              <PcaBooleanRadio form={form} name={`${base}.efluentes.${slug}.monitoramento`} label="Monitoramento?" />
            </div>
          );
        })}
        <PcaCheckboxOptions
          form={form}
          name={`${base}.efluentes.destinoFinal`}
          options={[
            { id: 'solo', label: 'Lançamento no solo' },
            { id: 'corpo_hidrico', label: 'Lançamento em corpo d’água' },
          ]}
        />
        <PcaTextField form={form} name={`${base}.efluentes.corpoHidricoIdentificacao`} label="Identificação do corpo hídrico receptor" />
      </PcaSectionCard>

      <PcaSectionCard title="28. Resíduos sólidos e material particulado">
        {tiposResiduo.map((tipo) => {
          const slug = tipo.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium">{tipo}</p>
              <PcaTextField form={form} name={`${base}.residuosSolidos.${slug}.fontes`} label="Fontes geradoras" />
              <PcaBooleanRadio form={form} name={`${base}.residuosSolidos.${slug}.empresaLicenciada`} label="Destina para empresa licenciada?" />
              <PcaTextField form={form} name={`${base}.residuosSolidos.${slug}.empresaReceptora`} label="Empresa receptora" />
            </div>
          );
        })}
        <FormDescription>Material particulado e gases – perfuração, detonação, transporte, beneficiamento, motores.</FormDescription>
        <PcaTextField form={form} name={`${base}.emissoes.particuladoGases`} label="Fontes, sistemas de controle e tipologia" />
      </PcaSectionCard>

      <PcaSectionCard title="29. Caracterização geológica e geomorfológica">
        <PcaTextAreaField
          form={form}
          name={`${base}.geologiaGeomorfologia.descricao`}
          label="Descrição geológica e geomorfológica da área e entorno"
        />
      </PcaSectionCard>

      <PcaSectionCard title="30 a 32. Impactos visuais, decapeamento e socioeconômicos (Módulo 5)">
        <PcaTextAreaField form={form} name={`${base}.impactos.visuaisPaisagem`} label="30. Impactos visuais, degradação do solo e da paisagem" />
        <PcaTextAreaField form={form} name={`${base}.impactos.decapeamentoLavra`} label="31. Decapeamento do estéril e lavra do minério" />
        <PcaTextAreaField form={form} name={`${base}.impactos.socioeconomicosDescricao`} label="32. Impactos socioeconômicos" />
      </PcaSectionCard>

      <PcaSectionCard title="33 a 35. Quadro resumo de impactos (Módulo 6)">
        <PcaCheckboxOptions form={form} name={`${base}.impactos.meioFisico`} options={impactosMeioFisico.map((i) => ({ id: i, label: i }))} />
        <PcaTextField form={form} name={`${base}.impactos.meioFisicoOutros`} label="Meio físico – outros" />
        <PcaCheckboxOptions form={form} name={`${base}.impactos.meioBiotico`} options={impactosMeioBiotico.map((i) => ({ id: i, label: i }))} />
        <PcaTextField form={form} name={`${base}.impactos.meioBioticoOutros`} label="Meio biótico – outros" />
        <PcaCheckboxOptions form={form} name={`${base}.impactos.meioSocioeconomico`} options={impactosMeioSocioeconomico.map((i) => ({ id: i, label: i }))} />
        <PcaTextField form={form} name={`${base}.impactos.meioSocioeconomicoOutros`} label="Meio socioeconômico – outros" />
      </PcaSectionCard>

      <PcaSectionCard title="36. Componente geofísico e biótico (ZEE – Módulo 7)">
        {zeeGeofisico.map((camada) => {
          const slug = camada.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <PcaTextField form={form} name={`${base}.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <PcaNumField form={form} name={`${base}.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </PcaSectionCard>

      <PcaSectionCard title="37. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.populacao`} label="População" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
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
