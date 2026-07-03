import type { GeoAnalysisBundle } from '@/lib/geospatial/load-geo-analysis-bundle';
import { buildGeoPlaceholderData } from '@/lib/geospatial/geo-placeholders';

export type GeoToPeaImportMode = 'substituir' | 'anexar';

export type GeoToPeaOptions = {
  modo: GeoToPeaImportMode;
  /** Incluir trecho socioeconômico do complemento IA, se existir */
  incluirSocioeconomico?: boolean;
  /** Incluir tabela completa de camadas na nota ADA */
  incluirTabelaCamadas?: boolean;
  /** Incluir hidrografia / meio físico resumido na ABEA */
  incluirMeioFisico?: boolean;
};

export type GeoToPeaTexts = {
  abeaDescricao: string;
  adaGeometriaNotas: string;
  abeaGeometriaNotas: string;
  resumoLinha: string;
};

function mergeText(
  modo: GeoToPeaImportMode,
  existing: string | undefined,
  generated: string,
): string {
  const prev = existing?.trim() ?? '';
  const gen = generated.trim();
  if (!gen) return prev;
  if (!prev || modo === 'substituir') return gen;
  return `${prev}\n\n---\nImportado da análise geoespacial:\n\n${gen}`;
}

/**
 * Monta textos sugeridos para ABEA/ADA a partir de um pacote geo_analyses (Passo 3).
 */
export function buildPeaTextsFromGeoBundle(
  bundle: GeoAnalysisBundle,
  existing: Partial<Pick<GeoToPeaTexts, 'abeaDescricao' | 'adaGeometriaNotas' | 'abeaGeometriaNotas'>>,
  options: GeoToPeaOptions,
): GeoToPeaTexts {
  const geo = buildGeoPlaceholderData(bundle.wave, bundle.complement);
  const opts = {
    incluirSocioeconomico: true,
    incluirTabelaCamadas: true,
    incluirMeioFisico: true,
    ...options,
  };

  const abeaParts: string[] = [
    'Delimitação sugerida com base na análise geoespacial (SIG) vinculada ao PEA.',
    `Perímetro analisado: ${geo.GEO_AREA_HA} ha.`,
    `Camadas com dados: ${geo.GEO_CAMADAS_OK} (gerado em ${geo.GEO_DATA_GERACAO.slice(0, 10)}).`,
    geo.GEO_RESUMO_FACTUAL,
  ];

  if (opts.incluirMeioFisico && geo.BLOCO_MEIO_FISICO) {
    abeaParts.push('Meio físico (complemento geoespacial):', geo.BLOCO_MEIO_FISICO);
  }
  if (opts.incluirSocioeconomico && geo.BLOCO_MEIO_SOCIOECONOMICO) {
    abeaParts.push('Contexto socioeconômico (complemento):', geo.BLOCO_MEIO_SOCIOECONOMICO);
  }

  abeaParts.push(
    'Grupos sociais na ABEA devem ser confirmados em campo (DSP) e, quando exigido, com KML/SHP da ADA e ABEA no protocolo SLA/FEAM.',
  );

  const adaParts: string[] = [
    `Análise geoespacial vinculada: ${bundle.analysisId}.`,
    'Área Diretamente Afetada (ADA): utilizar o perímetro do empreendimento e feições de intervenção cadastradas.',
    geo.GEO_MAPA_LEGENDA,
  ];

  if (opts.incluirTabelaCamadas) {
    adaParts.push('Resumo por camada (interseção com perímetro):', geo.GEO_TABELA_CAMADAS);
  }

  const abeaGeometriaNotas = [
    `ID análise: ${bundle.analysisId}`,
    `Área: ${geo.GEO_AREA_HA} ha`,
    'Exportar KML/SHP do perímetro e comunidades da ABEA para anexo ao processo.',
    bundle.empreendimentoId ? `Empreendimento (cadastro): ${bundle.empreendimentoId}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const generatedAbea = abeaParts.filter(Boolean).join('\n\n');
  const generatedAda = adaParts.filter(Boolean).join('\n\n');

  return {
    abeaDescricao: mergeText(opts.modo, existing.abeaDescricao, generatedAbea),
    adaGeometriaNotas: mergeText(opts.modo, existing.adaGeometriaNotas, generatedAda),
    abeaGeometriaNotas: mergeText(opts.modo, existing.abeaGeometriaNotas, abeaGeometriaNotas),
    resumoLinha: `${geo.GEO_AREA_HA} ha · ${geo.GEO_CAMADAS_OK} camadas`,
  };
}
