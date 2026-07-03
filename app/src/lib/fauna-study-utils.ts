import type { FaunaStudy } from "@/lib/types";

export const FAUNA_STUDY_TYPE_LABELS: Record<FaunaStudy["studyType"], string> = {
  inventario_projeto: "Projeto de Inventário",
  inventario_relatorio: "Relatório de Inventário",
  monitoramento_projeto: "Projeto de Monitoramento",
  monitoramento_relatorio: "Relatório de Monitoramento",
  resgate_projeto: "Projeto de Resgate",
  resgate_relatorio: "Relatório de Resgate",
  externo: "Documento Externo",
};

export function getFaunaStudyLabel(study: Pick<FaunaStudy, "studyType" | "documentName">) {
  if (study.studyType === "externo") {
    return study.documentName || FAUNA_STUDY_TYPE_LABELS.externo;
  }
  return FAUNA_STUDY_TYPE_LABELS[study.studyType] || "Estudo de Fauna";
}

export function getFaunaStudyEditPath(study: Pick<FaunaStudy, "id" | "studyType">): string {
  switch (study.studyType) {
    case "inventario_projeto":
      return `/studies/fauna/inventario/${study.id}`;
    case "inventario_relatorio":
      return `/studies/fauna/inventario-relatorio/${study.id}`;
    case "monitoramento_projeto":
      return `/studies/fauna/monitoramento/${study.id}`;
    case "monitoramento_relatorio":
      return `/studies/fauna/monitoramento-relatorio/${study.id}`;
    case "resgate_projeto":
      return `/studies/fauna/resgate/${study.id}`;
    case "resgate_relatorio":
      return `/studies/fauna/resgate-relatorio/${study.id}`;
    default:
      return "/studies/fauna";
  }
}

export type FaunaStudyAddAction = {
  label: string;
  href: string;
};

export const FAUNA_STUDY_ADD_ACTIONS: FaunaStudyAddAction[] = [
  { label: "Projeto de Inventário", href: "/studies/fauna/inventario" },
  { label: "Relatório de Inventário", href: "/studies/fauna/inventario-relatorio" },
  { label: "Projeto de Monitoramento", href: "/studies/fauna/monitoramento" },
  { label: "Relatório de Monitoramento", href: "/studies/fauna/monitoramento-relatorio" },
  { label: "Projeto de Resgate", href: "/studies/fauna/resgate" },
  { label: "Relatório de Resgate", href: "/studies/fauna/resgate-relatorio" },
];

const FAUNA_PROJETO_TYPES = new Set<FaunaStudy["studyType"]>([
  "inventario_projeto",
  "monitoramento_projeto",
  "resgate_projeto",
]);

export function isFaunaProjetoStudyType(
  studyType: FaunaStudy["studyType"],
): boolean {
  return FAUNA_PROJETO_TYPES.has(studyType);
}

/** URL para criar relatório vinculado a um projeto técnico concluído (ou em elaboração). */
export function getFaunaRelatorioCreatePathFromProjeto(
  projeto: Pick<FaunaStudy, "id" | "studyType">,
): string | null {
  switch (projeto.studyType) {
    case "inventario_projeto":
      return `/studies/fauna/inventario-relatorio?projetoId=${encodeURIComponent(projeto.id)}`;
    case "monitoramento_projeto":
      return `/studies/fauna/monitoramento-relatorio?projetoId=${encodeURIComponent(projeto.id)}`;
    case "resgate_projeto":
      return `/studies/fauna/resgate-relatorio?projetoId=${encodeURIComponent(projeto.id)}`;
    default:
      return null;
  }
}
