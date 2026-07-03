import { sortByLabelPt } from "@/lib/sort-pt-br";
import type {
  DefesaAnexo,
  MultaDefesaDocumentState,
  MultaDefesaDocTemplate,
} from "@/lib/multas-defesas/types";

/** Documentos da fase de instrução (apensar ao protocolo). */
export const MULTA_DEFESA_DOCS_ANEXAR: MultaDefesaDocTemplate[] = sortByLabelPt(
  [
    {
      id: "anx_auto",
      label: "Cópia do Auto de Infração",
      kind: "anexar",
      phase: "instrucao",
      requirement: "sempre",
    },
    {
      id: "anx_id",
      label: "Documento de identificação do autuado",
      kind: "anexar",
      phase: "instrucao",
      requirement: "sempre",
    },
    {
      id: "anx_end",
      label: "Comprovante de endereço / indicação para intimações",
      kind: "anexar",
      phase: "instrucao",
      requirement: "sempre",
    },
    {
      id: "anx_proc",
      label: "Procuração ou substabelecimento",
      kind: "anexar",
      phase: "instrucao",
      requirement: "procurador",
    },
    {
      id: "anx_pj",
      label: "Contrato social e última alteração (PJ)",
      kind: "anexar",
      phase: "instrucao",
      requirement: "pj",
    },
    {
      id: "anx_taxa",
      label: "DAE — taxa de expediente + comprovante (multa ≥ 1.661 UFEMG)",
      kind: "anexar",
      phase: "instrucao",
      requirement: "taxa_expediente",
      helpUrl:
        "https://semad.mg.gov.br/w/apresentacao-de-defesas-e-recursos",
    },
    {
      id: "anx_lic",
      label: "Licença, autorização, CAR ou comprovação de regularidade",
      kind: "anexar",
      phase: "instrucao",
      requirement: "opcional",
    },
    {
      id: "anx_vista",
      label: "Cópias obtidas na vista do processo administrativo",
      kind: "anexar",
      phase: "instrucao",
      requirement: "opcional",
    },
    {
      id: "anx_geo",
      label: "Mapas, imagens, laudos e provas documentais",
      kind: "anexar",
      phase: "instrucao",
      requirement: "opcional",
    },
    {
      id: "anx_outros",
      label: "Outros documentos de instrução",
      kind: "anexar",
      phase: "instrucao",
      requirement: "opcional",
    },
  ],
  (d) => d.label,
);

export const MULTA_DEFESA_DOCS_ELABORAR: MultaDefesaDocTemplate[] = sortByLabelPt(
  [
    {
      id: "elab_peticao",
      label: "Defesa administrativa (petição principal)",
      kind: "elaborar",
      phase: "elaboracao",
      requirement: "sempre",
    },
    {
      id: "elab_memorial",
      label: "Memorial técnico complementar",
      kind: "elaborar",
      phase: "elaboracao",
      requirement: "opcional",
    },
    {
      id: "elab_req_aux",
      label: "Requerimentos auxiliares (desembargo, provas, conversão)",
      kind: "elaborar",
      phase: "elaboracao",
      requirement: "opcional",
    },
  ],
  (d) => d.label,
);

export const MULTA_DEFESA_DOCS_PROTOCOLO: MultaDefesaDocTemplate[] = [
  {
    id: "prot_comprovante",
    label: "Comprovante de protocolo (SEI, AR ou carimbo)",
    kind: "anexar",
    phase: "protocolo",
    requirement: "sempre",
  },
];

export const MULTA_DEFESA_DOCS_TEMPLATE: MultaDefesaDocTemplate[] = [
  ...MULTA_DEFESA_DOCS_ANEXAR,
  ...MULTA_DEFESA_DOCS_ELABORAR,
  ...MULTA_DEFESA_DOCS_PROTOCOLO,
];

export const MULTA_AUTO_ANEXO_DOC_ID = "anx_auto";
export const LEGACY_CHECKLIST_TO_DOC: Record<string, string> = {
  qualificacao: "anx_id",
  fatos: "elab_peticao",
  provas: "anx_geo",
  pedidos: "elab_peticao",
  procuracao: "anx_proc",
  assinatura: "elab_peticao",
};

export function createMultaDefesaDocuments(): MultaDefesaDocumentState[] {
  return MULTA_DEFESA_DOCS_TEMPLATE.map((t) => ({
    ...t,
    checked: false,
  }));
}

export function mergeMultaDefesaDocumentsSaved(
  saved: MultaDefesaDocumentState[] | undefined,
  anexos?: DefesaAnexo[],
  legacyChecklist?: Array<{ itemId: string; checked: boolean }>,
): MultaDefesaDocumentState[] {
  const byId = new Map((saved ?? []).map((d) => [d.id, d]));
  const merged = MULTA_DEFESA_DOCS_TEMPLATE.map((t) => {
    const existing = byId.get(t.id);
    if (existing) {
      return { ...existing, id: t.id, label: t.label, kind: t.kind, phase: t.phase, requirement: t.requirement };
    }
    return { ...t, checked: false };
  });

  for (const anexo of anexos ?? []) {
    const legacyId = anexo.checklistItemId || "";
    const docId =
      anexo.documentId ||
      (legacyId === "auto_infracao" ? MULTA_AUTO_ANEXO_DOC_ID : undefined) ||
      LEGACY_CHECKLIST_TO_DOC[legacyId] ||
      legacyId;
    const row = merged.find((d) => d.id === docId);
    if (row && anexo.url) {
      row.checked = true;
      row.fileName = anexo.name;
      row.fileUrl = anexo.url;
      row.contentType = anexo.contentType;
    }
  }

  for (const c of legacyChecklist ?? []) {
    const docId = LEGACY_CHECKLIST_TO_DOC[c.itemId];
    if (!docId) continue;
    const row = merged.find((d) => d.id === docId);
    if (row && c.checked) row.checked = true;
  }

  const peticao = merged.find((d) => d.id === "elab_peticao");
  if (peticao && legacyChecklist?.some((c) => c.checked)) {
    peticao.checked = true;
  }

  return merged;
}

export function countRequiredDocs(
  docs: MultaDefesaDocumentState[],
  opts: { isPj?: boolean; hasProcurador?: boolean; requiresTaxaExpediente?: boolean },
): { done: number; total: number } {
  let total = 0;
  let done = 0;
  for (const d of docs) {
    if (d.kind !== "anexar" || d.phase !== "instrucao") continue;
    if (d.requirement === "opcional") continue;
    if (d.requirement === "pj" && !opts.isPj) continue;
    if (d.requirement === "procurador" && !opts.hasProcurador) continue;
    if (d.requirement === "taxa_expediente" && !opts.requiresTaxaExpediente) continue;
    total += 1;
    if (d.checked && d.fileUrl) done += 1;
  }
  return { done, total };
}
