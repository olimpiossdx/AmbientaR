import type { AutoInfracaoDefesaRecord, DefesaConteudo } from "@/lib/multas-defesas/types";

function valueOrPlaceholder(value: string | undefined, placeholder: string): string {
  const normalized = (value || "").trim();
  return normalized.length > 0 ? normalized : placeholder;
}

export function formatDefesaDocContent(
  defesa: Pick<
    AutoInfracaoDefesaRecord,
    "processNumber" | "tipoDefesa" | "informacoesInternas" | "defesaConteudo" | "checklist" | "anexos" | "documentos"
  >,
  empreendedorNome: string,
  empreendimentoNome: string,
): string {
  const conteudo: DefesaConteudo = defesa.defesaConteudo || {};
  const lines: string[] = [];

  lines.push(`Processo interno: ${defesa.processNumber}`);
  if (defesa.tipoDefesa) lines.push(`Tipo: ${defesa.tipoDefesa}`);
  lines.push(`Empreendedor: ${empreendedorNome}`);
  lines.push(`Empreendimento: ${empreendimentoNome}`);
  lines.push("");

  const pushSection = (title: string, body?: string) => {
    lines.push(title);
    lines.push(body?.trim() || "Não informado.");
    lines.push("");
  };

  pushSection(
    "Endereçamento e qualificação",
    conteudo.enderecamentoQualificacao,
  );
  pushSection(
    "Referência (Auto de Infração e processo administrativo)",
    conteudo.referenciaAutoProcesso,
  );
  pushSection("I — Dos fatos / síntese do auto", conteudo.sinteseAuto);
  pushSection("Preliminares (nulidades e vícios de forma)", conteudo.preliminaresNulidades);
  pushSection("Decadência e prescrição", conteudo.decadenciaPrescricao);
  pushSection("Mérito — inexistência do fato", conteudo.meritoInexistenciaFato);
  pushSection("Mérito — atipicidade", conteudo.meritoAtipicidade);
  pushSection(
    "Mérito — ausência de autoria/responsabilidade",
    conteudo.meritoAusenciaAutoria,
  );
  pushSection(
    "Mérito — regularidade da atividade",
    conteudo.meritoRegularidadeAtividade,
  );
  pushSection("Atenuantes (subsidiário)", conteudo.atenuantes);
  pushSection("Conversão de multa (subsidiário)", conteudo.conversaoMulta);
  pushSection("Pedidos", conteudo.pedidos);

  const autoMedida = (conteudo.autoMedidaCautelar || "").trim();
  if (autoMedida) {
    lines.push("Medida cautelar / embargo");
    lines.push(autoMedida);
    lines.push("");
  }

  const laudoNumero = (conteudo.laudoNumero || "").trim();
  const laudoTrecho = (conteudo.laudoTrechoTecnico || "").trim();
  if (laudoNumero || laudoTrecho) {
    lines.push("Referência técnica");
    if (laudoNumero) lines.push(`Laudo/parecer nº ${laudoNumero}`);
    if (laudoTrecho) lines.push(laudoTrecho);
    lines.push("");
  }

  lines.push("Dados do auto (referência)");
  lines.push(
    [
      conteudo.autoNumero && `Auto nº ${conteudo.autoNumero}`,
      conteudo.autoCodigo && `Código: ${conteudo.autoCodigo}`,
      conteudo.autoArtigoBase && `Tipificação: ${conteudo.autoArtigoBase}`,
      conteudo.autoValorMulta && `Multa: ${conteudo.autoValorMulta}`,
      conteudo.autoDataFato && `Fato: ${conteudo.autoDataFato}`,
      conteudo.autoRelatoFiscal && `Relato: ${conteudo.autoRelatoFiscal}`,
    ]
      .filter(Boolean)
      .join("\n") || "Não informado.",
  );
  lines.push("");

  if ((defesa.informacoesInternas || "").trim()) {
    lines.push("Informações internas (não protocolar)");
    lines.push(defesa.informacoesInternas!.trim());
    lines.push("");
  }

  const docList =
    defesa.documentos?.filter((d) => d.checked) ||
    [];
  if (docList.length > 0) {
    lines.push("Documentos do trâmite");
    for (const d of docList) {
      const file = d.fileName ? ` — ${d.fileName}` : "";
      lines.push(`- [${d.kind === "anexar" ? "Anexar" : "Elaborar"}] ${d.label}${file}`);
    }
    lines.push("");
  }

  const anexos = (defesa.anexos || []).map((a) => `- ${a.name}`).join("\n");
  lines.push("Anexos arquivados");
  lines.push(anexos || "Sem anexos.");

  return lines.join("\n");
}

/** Preenche campos da peça a partir dos dados da abertura (auto). */
export function buildDefesaConteudoFromAuto(
  existing: DefesaConteudo | undefined,
  empreendedorNome: string,
  empreendimentoNome: string,
  project?: { geographicLocation?: unknown; propertyName?: string } | null,
): DefesaConteudo {
  const c = { ...existing };
  if (!c.referenciaAutoProcesso && c.autoNumero) {
    c.referenciaAutoProcesso = `Auto de Infração nº ${c.autoNumero}`;
  }
  if (!c.sinteseAuto && (c.autoRelatoFiscal || c.autoNumero)) {
    const parts = [
      c.autoDataFato && `Em ${c.autoDataFato}`,
      c.autoRelatoFiscal && `foi imputada a conduta: ${c.autoRelatoFiscal}`,
      c.autoCodigo && `Código ${c.autoCodigo}`,
      c.autoArtigoBase && `Tipificação: ${c.autoArtigoBase}`,
      c.autoValorMulta && `Multa: ${c.autoValorMulta}`,
    ].filter(Boolean);
    c.sinteseAuto = parts.join(". ");
  }
  if (!c.enderecamentoQualificacao?.trim()) {
    c.enderecamentoQualificacao = `${empreendedorNome}, responsável pelo empreendimento ${empreendimentoNome}, vem apresentar defesa administrativa no prazo legal.`;
  }
  return c;
}
