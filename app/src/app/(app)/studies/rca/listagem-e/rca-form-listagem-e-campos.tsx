'use client';

import {
  RcaBooleanRadio,
  RcaSectionCard,
  RcaTextAreaField,
  RcaTextField,
} from '../listagem-a/rca-form-listagem-a-helpers';
import { RcaFormListagemEGeoTrecho } from './rca-form-listagem-e-geo-trecho';
import type { RcaListagemEFormTipo } from './rca-listagem-e-registry';

type CamposProps = {
  form: any;
  tipo: RcaListagemEFormTipo;
};

function CamposRodovias({ form }: { form: any }) {
  const base = 'listagemE.rodovias';
  return (
    <RcaSectionCard title="Caracterização – Rodovias">
      <RcaTextField form={form} name={`${base}.trecho`} label="Trecho / ligação" />
      <RcaTextField form={form} name={`${base}.extensaoKm`} label="Extensão total (km)" />
      <RcaTextField form={form} name={`${base}.larguraFaixa`} label="Largura da faixa de domínio (m)" />
      <RcaTextField form={form} name={`${base}.tipoObra`} label="Tipo de obra (nova / duplicação / manutenção)" />
      <RcaTextField form={form} name={`${base}.tipoPavimento`} label="Tipo de pavimento" />
      <RcaTextAreaField
        form={form}
        name={`${base}.intervencoesPrevistas`}
        label="Intervenções previstas (terraplenagem, drenagem, obras de arte)"
      />
      <RcaFormListagemEGeoTrecho form={form} />
    </RcaSectionCard>
  );
}

function CamposGasoduto({ form }: { form: any }) {
  const base = 'listagemE.gasoduto';
  return (
    <RcaSectionCard title="Caracterização – Dutos e gasodutos">
      <RcaTextField form={form} name={`${base}.produtoTransportado`} label="Produto transportado" />
      <RcaTextField form={form} name={`${base}.diametroNominal`} label="Diâmetro nominal (pol/mm)" />
      <RcaTextField form={form} name={`${base}.extensaoKm`} label="Extensão do duto (km)" />
      <RcaTextField form={form} name={`${base}.pressaoOperacao`} label="Pressão de operação" />
      <RcaTextField form={form} name={`${base}.vazaoProjeto`} label="Vazão de projeto" />
      <RcaTextAreaField
        form={form}
        name={`${base}.estacoesCompressoras`}
        label="Estações compressoras / bombas / válvulas"
      />
      <RcaFormListagemEGeoTrecho form={form} />
    </RcaSectionCard>
  );
}

function CamposRecapacitacao({ form }: { form: any }) {
  const base = 'listagemE.recapacitacaoCghPch';
  return (
    <RcaSectionCard title="Caracterização – CGH / PCH">
      <RcaTextField form={form} name={`${base}.nomeUsina`} label="Nome da usina" />
      <RcaTextField form={form} name={`${base}.rio`} label="Corpo hídrico / bacia" />
      <RcaTextField form={form} name={`${base}.potenciaAtualMw`} label="Potência instalada atual (MW)" />
      <RcaTextField form={form} name={`${base}.potenciaNovaMw`} label="Potência após recapacitação (MW)" />
      <RcaTextField form={form} name={`${base}.vazaoAproveitada`} label="Vazão aproveitada (m³/s)" />
      <RcaTextAreaField
        form={form}
        name={`${base}.intervencoesHidraulicas`}
        label="Intervenções hidráulicas previstas"
      />
    </RcaSectionCard>
  );
}

function CamposBiogas({ form }: { form: any }) {
  const base = 'listagemE.biogasAterro';
  return (
    <RcaSectionCard title="Caracterização – Biogás de aterro">
      <RcaTextField form={form} name={`${base}.aterroVinculado`} label="Aterro sanitário vinculado" />
      <RcaTextField form={form} name={`${base}.capacidadeGeracaoMwh`} label="Geração estimada (MWh/ano)" />
      <RcaTextField form={form} name={`${base}.potenciaInstaladaMw`} label="Potência instalada (MW)" />
      <RcaBooleanRadio
        form={form}
        name={`${base}.geracaoEnergia`}
        label="Geração de energia elétrica?"
      />
      <RcaTextAreaField
        form={form}
        name={`${base}.sistemaCaptacao`}
        label="Sistema de captação e tratamento do biogás"
      />
    </RcaSectionCard>
  );
}

function CamposBiometanizacao({ form }: { form: any }) {
  const base = 'listagemE.biometanizacaoRsu';
  return (
    <RcaSectionCard title="Caracterização – Biometanização de RSU">
      <RcaTextField form={form} name={`${base}.capacidadeTratamentoTpd`} label="Capacidade de tratamento (t/dia)" />
      <RcaTextField form={form} name={`${base}.geracaoEnergiaMwh`} label="Geração de energia (MWh/ano)" />
      <RcaTextField form={form} name={`${base}.tecnologia`} label="Tecnologia (digestão anaeróbia, etc.)" />
      <RcaTextAreaField
        form={form}
        name={`${base}.destinoDigestato`}
        label="Destino do digestato / subprodutos"
      />
    </RcaSectionCard>
  );
}

function CamposTratamentoTermico({ form }: { form: any }) {
  const base = 'listagemE.tratamentoTermicoRsu';
  return (
    <RcaSectionCard title="Caracterização – Tratamento térmico de RSU">
      <RcaTextField form={form} name={`${base}.capacidadeIncineracaoTpd`} label="Capacidade (t/dia)" />
      <RcaTextField form={form} name={`${base}.geracaoEnergiaMwh`} label="Geração de energia (MWh/ano)" />
      <RcaTextField form={form} name={`${base}.tipoForno`} label="Tipo de forno / incinerador" />
      <RcaTextAreaField
        form={form}
        name={`${base}.controleEmissoes`}
        label="Sistemas de controle de emissões atmosféricas"
      />
    </RcaSectionCard>
  );
}

function CamposBarragemSaneamento({ form }: { form: any }) {
  const base = 'listagemE.barragemSaneamento';
  return (
    <RcaSectionCard title="Caracterização – Barragem de saneamento">
      <RcaTextField form={form} name={`${base}.nomeBarragem`} label="Nome da barragem" />
      <RcaTextField form={form} name={`${base}.finalidade`} label="Finalidade (ETE, reservatório, etc.)" />
      <RcaTextField form={form} name={`${base}.alturaMaxima`} label="Altura máxima (m)" />
      <RcaTextField form={form} name={`${base}.volumeReservatorio`} label="Volume do reservatório (m³)" />
      <RcaTextField form={form} name={`${base}.classificacaoRisco`} label="Classificação de risco (A/B/C/D)" />
      <RcaTextAreaField
        form={form}
        name={`${base}.planoSeguranca`}
        label="Plano de segurança de barragem (PSB)"
      />
    </RcaSectionCard>
  );
}

function CamposAbastecimentoAgua({ form }: { form: any }) {
  const base = 'listagemE.abastecimentoAgua';
  return (
    <RcaSectionCard title="Caracterização – Abastecimento de água">
      <RcaTextField form={form} name={`${base}.populacaoAtendida`} label="População atendida" />
      <RcaTextField form={form} name={`${base}.vazaoProjeto`} label="Vazão de projeto (L/s ou m³/dia)" />
      <RcaTextField form={form} name={`${base}.manancial`} label="Manancial / captação" />
      <RcaTextAreaField
        form={form}
        name={`${base}.sistemasTratamento`}
        label="Sistemas de tratamento e reservação"
      />
    </RcaSectionCard>
  );
}

function CamposEsgotamento({ form }: { form: any }) {
  const base = 'listagemE.esgotamentoSanitario';
  return (
    <RcaSectionCard title="Caracterização – Esgotamento sanitário">
      <RcaTextField form={form} name={`${base}.populacaoAtendida`} label="População atendida" />
      <RcaTextField form={form} name={`${base}.extensaoRedeKm`} label="Extensão da rede (km)" />
      <RcaTextField form={form} name={`${base}.tipoTratamento`} label="Tipo de tratamento de efluentes" />
      <RcaTextAreaField
        form={form}
        name={`${base}.estacoesElevatorias`}
        label="Estações elevatórias e emissários"
      />
    </RcaSectionCard>
  );
}

function CamposTratamentoRsu({ form }: { form: any }) {
  const base = 'listagemE.tratamentoRsu';
  return (
    <RcaSectionCard title="Caracterização – Tratamento e disposição de RSU">
      <RcaTextField form={form} name={`${base}.capacidadeRecepcaoTpd`} label="Capacidade de recepção (t/dia)" />
      <RcaTextField form={form} name={`${base}.tipoDisposicao`} label="Tipo de disposição final" />
      <RcaTextField form={form} name={`${base}.areaAterroHa`} label="Área do aterro / unidade (ha)" />
      <RcaTextAreaField
        form={form}
        name={`${base}.operacoesTratamento`}
        label="Operações de tratamento (triagem, compostagem, etc.)"
      />
    </RcaSectionCard>
  );
}

function CamposSoloUrbano({ form }: { form: any }) {
  const base = 'listagemE.soloUrbano';
  return (
    <RcaSectionCard title="Caracterização – Solo urbano residencial">
      <RcaTextField form={form} name={`${base}.areaParcelamentoHa`} label="Área do parcelamento (ha)" />
      <RcaTextField form={form} name={`${base}.numLotes`} label="Número de lotes" />
      <RcaTextField form={form} name={`${base}.densidade`} label="Densidade / ocupação" />
      <RcaTextAreaField
        form={form}
        name={`${base}.infraestruturaUrbana`}
        label="Infraestrutura urbana prevista (vias, drenagem, áreas verdes)"
      />
    </RcaSectionCard>
  );
}

function CamposDragagem({ form }: { form: any }) {
  const base = 'listagemE.dragagem';
  return (
    <RcaSectionCard title="Caracterização – Dragagem">
      <RcaTextField form={form} name={`${base}.corpoDagua`} label="Corpo d'água" />
      <RcaTextField form={form} name={`${base}.volumeDragadoM3`} label="Volume a ser dragado (m³)" />
      <RcaTextField form={form} name={`${base}.destinoMaterial`} label="Destino do material dragado" />
      <RcaTextAreaField
        form={form}
        name={`${base}.metodoDragagem`}
        label="Método de dragagem e equipamentos"
      />
    </RcaSectionCard>
  );
}

export function RcaFormListagemECamposEspecificos({ form, tipo }: CamposProps) {
  switch (tipo) {
    case 'rodovias':
      return <CamposRodovias form={form} />;
    case 'gasoduto':
      return <CamposGasoduto form={form} />;
    case 'recapacitacao_cgh_pch':
      return <CamposRecapacitacao form={form} />;
    case 'biogas_aterro':
      return <CamposBiogas form={form} />;
    case 'biometanizacao_rsu':
      return <CamposBiometanizacao form={form} />;
    case 'tratamento_termico_rsu':
      return <CamposTratamentoTermico form={form} />;
    case 'barragem_saneamento':
      return <CamposBarragemSaneamento form={form} />;
    case 'abastecimento_agua':
      return <CamposAbastecimentoAgua form={form} />;
    case 'esgotamento_sanitario':
      return <CamposEsgotamento form={form} />;
    case 'tratamento_rsu':
      return <CamposTratamentoRsu form={form} />;
    case 'solo_urbano':
      return <CamposSoloUrbano form={form} />;
    case 'dragagem':
      return <CamposDragagem form={form} />;
    default:
      return null;
  }
}
