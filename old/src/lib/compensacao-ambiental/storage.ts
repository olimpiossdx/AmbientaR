import type { CompensacaoTipo } from "./config";

const STORAGE_VERSION = "v1";

export type CompensacaoProcessoDraft = {
  titulo: string;
  empreendimento: string;
  seiLicenca: string;
  seiCompensacao: string;
  condicionante: string;
  /** SNUC: código da planilha VR (VR01–VR26) */
  snucRamoVr?: string;
  checkedIds: string[];
  /** id do item → nome do ficheiro Word carregado localmente */
  templateFiles: Record<string, string>;
  updatedAt: string;
};

function storageKey(tipo: CompensacaoTipo): string {
  return `compensacao-ambiental-${STORAGE_VERSION}-${tipo}`;
}

export function loadCompensacaoDraft(tipo: CompensacaoTipo): CompensacaoProcessoDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(tipo));
    if (!raw) return null;
    return JSON.parse(raw) as CompensacaoProcessoDraft;
  } catch {
    return null;
  }
}

export function saveCompensacaoDraft(tipo: CompensacaoTipo, draft: CompensacaoProcessoDraft): void {
  if (typeof window === "undefined") return;
  draft.updatedAt = new Date().toISOString();
  localStorage.setItem(storageKey(tipo), JSON.stringify(draft));
}

export function createEmptyDraft(): CompensacaoProcessoDraft {
  return {
    titulo: "",
    empreendimento: "",
    seiLicenca: "",
    seiCompensacao: "",
    condicionante: "",
    checkedIds: [],
    templateFiles: {},
    updatedAt: new Date().toISOString(),
  };
}
