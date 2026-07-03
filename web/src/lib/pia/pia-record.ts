import type { PIA, PiaType } from '@/lib/types';

export type PiaCronogramaItem = {
  etapa?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
};

export type PiaImpactoRow = {
  impacto?: string;
  medidas?: string;
};

/** Dados completos do formulário PIA (Firestore + formulário). */
export type PiaRecord = PIA & {
  proprietario?: {
    clientId?: string;
    nome?: string;
    cpfCnpj?: string;
  };
  responsavelTecnico?: {
    nome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    formacao?: string;
    registroConselho?: string;
    art?: string;
    ctfAida?: string;
  };
  objetivo?: {
    texto?: string;
    supressao?: boolean;
    finalidade?: string;
    areaHa?: string;
  };
  diagnostico?: {
    meioBiotico?: string;
    meioAbiotico?: {
      clima?: string;
      solos?: string;
      hidrografia?: string;
      topografia?: string;
    };
    socioeconomico?: string;
  };
  caracterizacaoIntervencao?: {
    tecnica?: string;
    destinacaoMaterialLenhoso?: string;
  };
  cronograma?: PiaCronogramaItem[];
  empreendimento?: PIA['empreendimento'] & {
    denominacao?: string;
    car?: string;
    atividades?: string;
  };
  impactos?: PiaImpactoRow[];
  /** Inventário florestal (`inventories`) vinculado — seção 5 do PIA. */
  inventoryId?: string;
  /** Resumo textual da flora (preenchido ao importar do inventário). */
  floraResumo?: string;
  exportVersions?: PiaExportVersion[];
  latestExport?: {
    docx?: PiaExportRef;
    pdf?: PiaExportRef;
  };
};

export type PiaExportRef = {
  versionId: string;
  storagePath: string;
  downloadUrl: string;
  fileName: string;
  createdAt: string;
  sectionManifest: string[];
};

export type PiaExportVersion = PiaExportRef & {
  format: 'docx' | 'pdf';
  createdBy?: string;
};

export function asPiaRecord(data: PIA | null | undefined): PiaRecord | null {
  if (!data) return null;
  return data as PiaRecord;
}

export function usesInventarioForm(type: PiaType | null | undefined): boolean {
  return (
    type === 'Inventário Florestal' ||
    type === 'Corretivo' ||
    type === 'Simplificado'
  );
}
