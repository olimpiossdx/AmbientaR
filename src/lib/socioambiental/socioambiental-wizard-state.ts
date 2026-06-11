import type {
  ModoRelatorioSocioambiental,
  PresetAtividadeSocioambiental,
  ProdesModoCriterio,
  TipoPerimetroSocioambiental,
} from "@/lib/types/analise-socioambiental";
import {
  getBlocksForBiomaPreset,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/report-blocks-catalog";

export type GlebaDraft = {
  id: string;
  rotulo: string;
  geojsonText: string;
};

export type SocioambientalWizardState = {
  step: number;
  modoRelatorio: ModoRelatorioSocioambiental;
  presetAtividade: PresetAtividadeSocioambiental;
  prodesModo: ProdesModoCriterio;
  tipoPerimetro: TipoPerimetroSocioambiental;
  carNumber: string;
  polygonInput: string;
  tituloExtrato: string;
  agenteNome: string;
  agenteDocumento: string;
  /** CPF/CNPJ dos beneficiários CPR (um por linha ou vírgula). */
  beneficiariosCpr: string;
  /** URL de PDF externo opcional (extrato de terceiros). */
  pdfExternoUrl: string;
  selectedBlocks: SocioambientalReportBlockId[];
  includeParecerIa: boolean;
  glebas: GlebaDraft[];
};

export const WIZARD_STEP_LABELS = [
  "Relatório",
  "Território",
  "Agente",
  "Critérios",
  "Executar",
] as const;

export function createDefaultWizardState(): SocioambientalWizardState {
  return {
    step: 0,
    modoRelatorio: "extrato_socioambiental",
    presetAtividade: "mg_padrao",
    prodesModo: "agregado",
    tipoPerimetro: "car_rural",
    carNumber: "",
    polygonInput: "",
    tituloExtrato: "",
    agenteNome: "",
    agenteDocumento: "",
    beneficiariosCpr: "",
    pdfExternoUrl: "",
    selectedBlocks: getBlocksForBiomaPreset("mg_padrao"),
    includeParecerIa: false,
    glebas: [],
  };
}

export const MODO_RELATORIO_OPTIONS: {
  id: ModoRelatorioSocioambiental;
  title: string;
  description: string;
}[] = [
  {
    id: "extrato_socioambiental",
    title: "Extrato Socioambiental",
    description:
      "Matriz de critérios (Apto / Alerta / Inapto) e detalhes — qualquer atividade.",
  },
  {
    id: "extrato_risco_socioambiental",
    title: "Extrato Risco Socioambiental",
    description:
      "Sobreposição e proximidade por geometria (imóvel + glebas) + histórico CAR.",
  },
  {
    id: "extrato_completo",
    title: "Extrato Socioambiental completo",
    description: "Funde os dois relatórios sem redundância.",
  },
];

export const PRESET_ATIVIDADE_OPTIONS: {
  id: PresetAtividadeSocioambiental;
  label: string;
  description: string;
  suggestedTipo: TipoPerimetroSocioambiental;
}[] = [
  {
    id: "mg_padrao",
    label: "MG — padrão",
    description: "Cadastro, desmatamento, embargos e áreas protegidas.",
    suggestedTipo: "car_rural",
  },
  {
    id: "credito_rural",
    label: "Crédito rural / CPR",
    description: "CAR + glebas; inclui bloco de risco.",
    suggestedTipo: "car_rural",
  },
  {
    id: "empreendimento_geral",
    label: "Empreendimento / operação",
    description: "Polígono da operação; CAR opcional.",
    suggestedTipo: "poligono_operacao",
  },
  {
    id: "protocolo_personalizado",
    label: "Personalizado",
    description: "Escolha livre de critérios no passo 4.",
    suggestedTipo: "poligono_operacao",
  },
];

export function blocksForPreset(
  preset: PresetAtividadeSocioambiental,
): SocioambientalReportBlockId[] {
  switch (preset) {
    case "credito_rural":
      return getBlocksForBiomaPreset("completo");
    case "empreendimento_geral":
      return getBlocksForBiomaPreset("mg_padrao");
    case "protocolo_personalizado":
      return [];
    case "mg_padrao":
    default:
      return getBlocksForBiomaPreset("mg_padrao");
  }
}

export function modoRelatorioLabel(modo: ModoRelatorioSocioambiental): string {
  return MODO_RELATORIO_OPTIONS.find((o) => o.id === modo)?.title ?? modo;
}
