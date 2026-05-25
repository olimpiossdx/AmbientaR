import type { ProjetoTecnicoBarragem } from '@/lib/types';

function fmt(str: string | undefined | null): string {
  return str != null && String(str).trim() !== '' ? String(str).trim() : '—';
}

function formatTabelaNiveis(projeto: ProjetoTecnicoBarragem): string {
  const rows = projeto.capacidadeReservatorio?.tabelaNiveis;
  if (!rows?.length) return '—';
  const header = 'Cota | Área (m²) | Altura (m) | Volume (m³) | Vol. acumulado (m³)';
  const lines = rows.map(
    (r) =>
      `${fmt(r.cota)} | ${fmt(r.areaM2)} | ${fmt(r.alturaM)} | ${fmt(r.volumeM3)} | ${fmt(r.volumeAcumuladoM3)}`,
  );
  return [header, ...lines].join('\n');
}

/** Placeholders do template Word (slug barragens). */
export function buildBarragemPlaceholderExtras(
  projeto: ProjetoTecnicoBarragem,
): Record<string, string> {
  const rt = projeto.responsavelTecnico;
  const cap = projeto.capacidadeReservatorio;
  const hid = projeto.calculosHidrologicos;

  return {
    ARQUIVO_CODIGO: fmt(projeto.arquivoCodigo),
    APRESENTACAO: fmt(projeto.apresentacao),
    REQUERENTE_NOME: fmt(projeto.requerente?.nome),
    REQUERENTE_CPF_CNPJ: fmt(projeto.requerente?.cpfCnpj),
    EMPREENDIMENTO_DENOMINACAO: fmt(projeto.empreendimento?.denominacao),
    EMPREENDIMENTO_MUNICIPIO: fmt(projeto.empreendimento?.municipio),
    EMPREENDIMENTO_UF: fmt(projeto.empreendimento?.uf),
    EMPREENDIMENTO_CAR: fmt(projeto.empreendimento?.car),
    EMPREENDIMENTO_MATRICULA: fmt(projeto.empreendimento?.matricula),
    USO_PRETENDIDO: fmt(projeto.usoPretendido),
    ESPELHO_DAGUA_M2: fmt(projeto.espelhoDaguaM2),
    CAPACIDADE_ARMAZENAMENTO_M3: fmt(projeto.capacidadeArmazenamentoM3),
    LOCAL_EMISSAO: fmt(projeto.localEmissao),
    DATA_EMISSAO: fmt(projeto.dataEmissao),
    RT_NOME: fmt(rt?.nome),
    RT_CPF: fmt(rt?.cpf),
    RT_EMAIL: fmt(rt?.email),
    RT_TELEFONE: fmt(rt?.telefone),
    RT_FORMACAO: fmt(rt?.formacao),
    RT_REGISTRO_CONSELHO: fmt(rt?.registroConselho),
    RT_ART: fmt(rt?.art),
    INFO_TOPOGRAFICAS: fmt(projeto.informacoesBasicas?.topograficas),
    LATITUDE: fmt(projeto.informacoesBasicas?.latitude),
    LONGITUDE: fmt(projeto.informacoesBasicas?.longitude),
    ALTITUDE: fmt(projeto.informacoesBasicas?.altitude),
    DEFINICAO_BARRAGEM: fmt(projeto.definicaoBarragem),
    CAPACIDADE_DESCRICAO: fmt(cap?.descricao),
    COTA_ESPELHO_DAGUA: fmt(cap?.cotaEspelhoDagua),
    COTA_TERRENO_NATURAL: fmt(cap?.cotaTerrenoNatural),
    AREA_ESPELHO_M2: fmt(cap?.areaEspelhoM2),
    VOLUME_ARMAZENADO_M3: fmt(cap?.volumeArmazenadoM3),
    TABELA_NIVEIS_RESERVATORIO: formatTabelaNiveis(projeto),
    ATERRO: fmt(projeto.aterro),
    TALUDES_ATERRO: fmt(projeto.taludesAterro),
    FUNDACAO: fmt(projeto.fundacao),
    DRENO_PE: fmt(projeto.drenoPe),
    DESCARGA_FUNDO: fmt(projeto.descargaFundo),
    HID_BACIA: fmt(hid?.caracteristicasBacia),
    HID_TEMPO_CONCENTRACAO: fmt(hid?.tempoConcentracao),
    HID_INTENSIDADE_CHUVA: fmt(hid?.intensidadeChuva),
    HID_COEFICIENTE_ESCOAMENTO: fmt(hid?.coeficienteEscoamento),
    HID_VAZAO_CHEIA: fmt(hid?.vazaoCheia),
    DIMENSIONAMENTO_CHEIA: fmt(projeto.dimensionamentoCapacidadeCheia),
    EXTRAVASOR: fmt(projeto.extravasor),
    IMPLANTACAO_PROJETO: fmt(projeto.implantacaoProjeto),
    CONSERVACAO_MANUTENCAO: fmt(projeto.conservacaoManutencao),
    LITERATURA_CONSULTADA: fmt(projeto.literaturaConsultada),
    ANEXOS_DESCRICAO: fmt(projeto.anexosDescricao),
    BARRAGEM_STATUS: fmt(projeto.status ?? 'Rascunho'),
  };
}
