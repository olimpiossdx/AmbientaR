import { decimalBr, grausMinSeg, meridianoCentralWgr } from "./format-br";
import type { MemorialMetadata, MemorialMetrics, MemorialSegment } from "./types";

function fmtOrInformar(value: string): string {
  const v = value.trim();
  return v || "INFORMAR";
}

function buildPerimetroParagraph(
  segments: MemorialSegment[],
): string {
  if (!segments.length) return "";

  let texto = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (i === 0) {
      texto +=
        `Inicia-se a descrição deste perímetro no vértice ${seg.fromVertex}, ` +
        `definido pelas coordenadas E: ${decimalBr(seg.easting1, 3)} m e ` +
        `N: ${decimalBr(seg.northing1, 3)} m; `;
    } else {
      texto += " ";
    }

    texto +=
      `segue com azimute ${grausMinSeg(seg.azimute)} e distância de ` +
      `${decimalBr(seg.distancia, 2)} m até o vértice ${seg.toVertex}, ` +
      `definido pelas coordenadas E: ${decimalBr(seg.easting2, 3)} m e ` +
      `N: ${decimalBr(seg.northing2, 3)} m`;

    if (seg.confrontante) {
      texto += `, confrontando com ${seg.confrontante}`;
    }
    texto += ";";
  }

  texto += " encerrando este perímetro.";
  return texto;
}

function buildRodapeNormativo(fuso: string): string {
  const mc = meridianoCentralWgr(fuso);
  return (
    "Todas as coordenadas aqui descritas estão georreferenciadas ao " +
    "Sistema Geodésico Brasileiro e encontram-se representadas no Sistema UTM, " +
    `referenciadas ao Meridiano Central ${mc} WGr, fuso ${fuso}S, tendo como datum ` +
    "o SIRGAS-2000. Todos os azimutes e distâncias, área e perímetro foram " +
    "calculados no plano de projeção UTM."
  );
}

export function buildMemorialFullText(params: {
  metadata: MemorialMetadata;
  segments: MemorialSegment[];
  metrics: MemorialMetrics;
}): string {
  const { metadata, segments, metrics } = params;
  const lines: string[] = [];

  lines.push("MEMORIAL DESCRITIVO");
  lines.push("");
  lines.push(`Imóvel: ${fmtOrInformar(metadata.imovel)}`);
  lines.push(`Proprietário: ${fmtOrInformar(metadata.proprietario)}`);
  lines.push(`CPF/CNPJ: ${fmtOrInformar(metadata.cpfCnpj)}`);
  lines.push(`UF: ${metadata.uf.trim() || "MG"}`);
  lines.push(`Município: ${fmtOrInformar(metadata.municipio)}`);
  lines.push(`Matrícula: ${fmtOrInformar(metadata.matricula)}`);
  lines.push(
    `Área (ha): ${decimalBr(metrics.areaHa, 4)} ` +
      `Perímetro (m): ${decimalBr(metrics.perimetroM, 2)} m`,
  );
  lines.push("");
  lines.push(metadata.tituloArea.trim() || "PERÍMETRO");
  lines.push("");
  lines.push(buildPerimetroParagraph(segments));
  lines.push("");
  lines.push(buildRodapeNormativo(metadata.fuso));
  lines.push("");
  lines.push("___________________________________________");
  lines.push(`Responsabilidade Técnica: ${fmtOrInformar(metadata.responsavelTecnico)}`);
  lines.push(`CREA/CFT: ${fmtOrInformar(metadata.creaCft)}`);

  return lines.join("\n");
}
