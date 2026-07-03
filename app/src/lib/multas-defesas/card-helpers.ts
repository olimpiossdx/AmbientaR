import type { AutoInfracaoDefesaRecord } from "@/lib/multas-defesas/types";

export function getDefesaResumoText(
  defesa: Pick<AutoInfracaoDefesaRecord, "informacoesInternas" | "defesaConteudo">,
): string | null {
  const interno = (defesa.informacoesInternas || "").trim();
  if (interno) return interno;
  const sintese = (defesa.defesaConteudo?.sinteseAuto || "").trim();
  return sintese || null;
}

export function getDefesaSinteseAuto(
  defesa: Pick<AutoInfracaoDefesaRecord, "informacoesInternas" | "defesaConteudo">,
): string | null {
  const sintese = (defesa.defesaConteudo?.sinteseAuto || "").trim();
  const interno = (defesa.informacoesInternas || "").trim();
  if (!sintese || sintese === interno) return null;
  return sintese;
}

export function getDefesaMotivosLinha(
  defesa: Pick<AutoInfracaoDefesaRecord, "defesaConteudo">,
): string | null {
  const c = defesa.defesaConteudo || {};
  const partes: string[] = [];
  const numero = (c.autoNumero || "").trim();
  const codigo = (c.autoCodigo || "").trim();
  const artigo = (c.autoArtigoBase || "").trim();
  const relato = (c.autoRelatoFiscal || "").trim();
  if (numero) partes.push(`Auto nº ${numero}`);
  if (codigo) partes.push(`Código: ${codigo}`);
  if (artigo) partes.push(`Tipificação: ${artigo}`);
  if (relato) partes.push(relato.replace(/\n/g, " · "));
  const multa = (c.autoValorMulta || "").trim();
  const dataFato = (c.autoDataFato || "").trim();
  if (multa) partes.push(`Multa: ${multa}`);
  if (dataFato) partes.push(`Fato: ${dataFato}`);
  const linha = partes.join(" · ").trim();
  return linha || null;
}
