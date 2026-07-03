import type {
  GeoAnalysisComplementOutput,
  GeoLayerResult,
  WaveAAnalysisResult,
} from '@/lib/types/geo-wave-a';

function fmtLayerTable(layers: GeoLayerResult[]): string {
  const lines: string[] = [];
  for (const layer of layers) {
    lines.push(`${layer.title} [${layer.status}] — ${layer.summary}`);
    if (layer.stats.length === 0) {
      lines.push('  (sem interseção mensurável)');
      continue;
    }
    for (const row of layer.stats) {
      const pct = row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : '—';
      const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : '—';
      const km = row.lengthKm != null ? ` | ${row.lengthKm.toFixed(2)} km` : '';
      lines.push(`  • ${row.label}: ${ha} | ${pct} do empreendimento${km}`);
    }
  }
  return lines.join('\n');
}

function sectionByKey(
  complement: GeoAnalysisComplementOutput | null | undefined,
  key: string,
): string {
  if (!complement) return '';
  const sec = complement.sections.find((s) => s.key === key);
  return sec?.bodyMarkdown?.trim() ?? '';
}

/**
 * Placeholders DOCX para análise geoespacial (Passo 3).
 * Ver docs/PLACEHOLDERS-DOCX.md
 */
export function buildGeoPlaceholderData(
  wave: WaveAAnalysisResult,
  complement?: GeoAnalysisComplementOutput | null,
): Record<string, string> {
  const ok = wave.layers.filter((l) => l.status === 'ok').length;
  const total = wave.layers.length || 8;

  const hidro = sectionByKey(complement, 'hidrografia');
  const meioFisico =
    sectionByKey(complement, 'meio_fisico') ||
    [
      sectionByKey(complement, 'geologia'),
      sectionByKey(complement, 'geomorfologia'),
      sectionByKey(complement, 'solos'),
      sectionByKey(complement, 'pedologia'),
    ]
      .filter(Boolean)
      .join('\n\n');
  const flora =
    sectionByKey(complement, 'vegetacao') ||
    sectionByKey(complement, 'meio_biotico') ||
    '';
  const fauna = sectionByKey(complement, 'fauna') || '';

  return {
    GEO_AREA_HA: wave.perimeter.areaHa.toFixed(2),
    GEO_RESUMO_FACTUAL: wave.factualSummary,
    GEO_TABELA_CAMADAS: fmtLayerTable(wave.layers),
    GEO_CAMADAS_OK: `${ok}/${total}`,
    GEO_DATA_GERACAO: wave.generatedAtUtc,
    GEO_MAPA_LEGENDA:
      'Mapas esquemáticos no relatório factual PDF (Análise Geoespacial). Conferir no IDE-Sisema MG.',
    GEO_COMPLEMENTO_RESUMO: complement?.resumoExecutivo?.trim() ?? '',
    GEO_SECAO_HIDROGRAFIA: hidro,
    BLOCO_MEIO_FISICO: meioFisico || wave.factualSummary,
    BLOCO_MEIO_BIOTICO_FLORA: flora,
    BLOCO_MEIO_BIOTICO_FAUNA: fauna,
    BLOCO_MEIO_SOCIOECONOMICO: sectionByKey(complement, 'meio_socioeconomico'),
    BLOCO_DESCRICAO_PROJETO: sectionByKey(complement, 'descricao_projeto'),
    BLOCO_CONCLUSAO_TECNICA: sectionByKey(complement, 'conclusao'),
  };
}

export function mergePlaceholderData(
  base: Record<string, string>,
  extra: Record<string, string>,
): Record<string, string> {
  return { ...base, ...extra };
}
