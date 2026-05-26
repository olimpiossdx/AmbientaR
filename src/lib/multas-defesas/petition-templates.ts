import type { PetitionSectionId } from "@/lib/multas-defesas/types";

export type PetitionModelId =
  | "supram_formal"
  | "escritorio_cobertura"
  | "semad_pmmg";

export type PetitionModel = {
  id: PetitionModelId;
  label: string;
  description: string;
  sectionStarters: Partial<Record<PetitionSectionId, string>>;
};

/** Modelos inspirados em peças reais (Forquilha/SUPRAM e Agroreservas/escritório). */
export const PETITION_MODELS: PetitionModel[] = [
  {
    id: "supram_formal",
    label: "Defesa à SUPRAM/SEMAD (direta)",
    description:
      "Endereçamento à autoridade da unidade do auto, qualificação do autuado e seções I–II (fatos e direito).",
    sectionStarters: {
      enderecamentoQualificacao: `Ilmo(a). Sr(a). [AUTORIDADE]
[CARGO] — [UNIDADE INDICADA NO AUTO]
[ENDEREÇO DA UNIDADE]

Auto de Infração nº [NÚMERO]
Nome do Autuado: [RAZÃO SOCIAL / NOME]
CNPJ/CPF: [DOCUMENTO]

[NOME DO AUTUADO], [qualificação completa], não se conformando com o auto de infração acima referido, vem, respeitosamente, no prazo legal, apresentar DEFESA ADMINISTRATIVA, pelos motivos de fato e de direito que se seguem:`,
      referenciaAutoProcesso: `Auto de Infração nº [NÚMERO]/[ANO]\nProcesso administrativo: [Nº PA/CAP ou SEI, se houver]`,
      sinteseAuto: `I – DOS FATOS\n\nEm [DATA], os agentes de fiscalização autuaram o empreendimento por [RELATO RESUMIDO DO AUTO].\n\nConforme o Decreto Estadual nº 47.383/2018, código [CÓDIGO]: [DESCRIÇÃO DA INFRAÇÃO IMPUTADA].`,
      preliminaresNulidades: `II – DO DIREITO E PRELIMINARES\n\nInicialmente, cumpre destacar a tempestividade da presente peça, apresentada dentro do prazo de 20 (vinte) dias previsto no art. 33 do Decreto nº 47.383/2018.`,
      meritoInexistenciaFato: `III – DO MÉRITO\n\nA autuação não reflete a realidade fática do empreendimento, conforme demonstrado pelos documentos anexos.`,
      pedidos: `IV – DOS PEDIDOS\n\nDiante do exposto, requer:\na) o recebimento e conhecimento da presente defesa;\nb) no mérito, o cancelamento/arquivamento do Auto de Infração nº [NÚMERO], ou, subsidiariamente, a redução da penalidade;\nc) o levantamento de eventuais medidas cautelares, se aplicável.\n\nTermos em que,\nPede deferimento.`,
    },
  },
  {
    id: "escritorio_cobertura",
    label: "Carta de encaminhamento + peça (escritório)",
    description:
      "Carta protocolo com referência a documentos numerados (DOC. 1, 2…) e peça técnica subdividida.",
    sectionStarters: {
      enderecamentoQualificacao: `[RAZÃO SOCIAL], pessoa jurídica de direito privado, com sede em [ENDEREÇO], inscrita no CNPJ sob o nº [CNPJ], vem, por seus procuradores (DOC. 1), apresentar DEFESA ADMINISTRATIVA relativa ao Auto de Infração em epígrafe, com os documentos que a instruem.`,
      referenciaAutoProcesso: `Ref.: Defesa Administrativa — Auto de Infração nº [NÚMERO]/[ANO]`,
      sinteseAuto: `I – DOS FATOS\n\n1.1. Em [DATA DE CIÊNCIA], a autuada tomou conhecimento da lavratura do Auto de Infração nº [NÚMERO] (DOC. 2), o qual imputou a penalidade de multa no valor de [VALOR/UFEMG].\n\n1.2. Foram atribuídas as seguintes condutas: [TRANSCREVER OU RESUMIR O RELATO FISCAL].`,
      preliminaresNulidades: `II – DA TEMPESTIVIDADE E ADMISSIBILIDADE\n\n2.1. A presente defesa é tempestiva, nos termos do art. 58 do Decreto nº 47.383/2018, tendo em vista a ciência em [DATA] (DOC. 3 – termo de cientificação).`,
      decadenciaPrescricao: `2.2. Não há decadência ou prescrição aplicável ao caso, ressalvadas as teses de mérito abaixo.`,
      meritoAtipicidade: `III – DO MÉRITO — ATIPICIDADE / INEXISTÊNCIA DO FATO\n\nA conduta descrita no auto não se subsume à tipificação indicada, por ausência de dano, nexo causal ou autorização/licença válida.`,
      meritoRegularidadeAtividade: `A atividade encontra-se em conformidade com a legislação ambiental e com a licença/autorização nº [NÚMERO], conforme documentação anexa.`,
      atenuantes: `IV – DAS ATENUANTES (SUBSIDIÁRIO)\n\nNa hipótese de não acolhimento integral, requer-se a aplicação das atenuantes legais.`,
      conversaoMulta: `V – DA CONVERSÃO DA MULTA (SUBSIDIÁRIO)\n\nSubsidiariamente, requer-se a conversão da multa em prestação de serviços ambientais, nos termos da legislação estadual.`,
      pedidos: `VI – DOS PEDIDOS\n\nAnte o exposto, requer-se o cancelamento do auto, ou, subsidiariamente, a redução/anulação da multa e o levantamento das medidas cautelares.\n\nNestes termos,\nPede deferimento.`,
    },
  },
  {
    id: "semad_pmmg",
    label: "Defesa PMMG / SEMAD (múltiplos destinatários)",
    description:
      "Endereçamento em cadeia (PMMG, NAI, DRCP, SUPRAM, SEMAD) como na peça Agroreservas.",
    sectionStarters: {
      enderecamentoQualificacao: `À\n[CÍRCULO / CIA PMMG]\nC/C\nNúcleo de Autos de Infração — NAI\nDiretoria Regional de Controle Processual — DRCP\nSuperintendência Regional de Meio Ambiente [REGIÃO] — SUPRAM\nSecretaria de Estado de Meio Ambiente — SEMAD/MG`,
      sinteseAuto: `I – DOS FATOS\n\nO autuado foi notificado da lavratura do Auto de Infração nº [NÚMERO], por suposta infração ao art. 112 e Anexos do Decreto nº 47.383/2018.`,
      pedidos: `Dos pedidos de praxe, com fundamento no contraditório e na ampla defesa (CF/88 e Decreto 47.383/2018).`,
    },
  },
];

export const PETITION_SECTION_META: Array<{
  id: PetitionSectionId;
  label: string;
  placeholder: string;
  phaseLabel: string;
}> = [
  {
    id: "enderecamentoQualificacao",
    label: "Endereçamento e qualificação",
    phaseLabel: "Abertura",
    placeholder:
      "Destinatário (SUPRAM, NAI/FEAM, URF SEMAD…), qualificação do autuado e procurador.",
  },
  {
    id: "referenciaAutoProcesso",
    label: "Referência (auto e processo)",
    phaseLabel: "Abertura",
    placeholder: "Número do auto, PA/CAP, processo SEI.",
  },
  {
    id: "sinteseAuto",
    label: "I — Dos fatos / síntese do auto",
    phaseLabel: "Fatos",
    placeholder: "Data, local, código da infração, relato e valor da multa.",
  },
  {
    id: "preliminaresNulidades",
    label: "Preliminares e nulidades",
    phaseLabel: "Preliminares",
    placeholder: "Tempestividade, legitimidade, vícios de forma e motivação.",
  },
  {
    id: "decadenciaPrescricao",
    label: "Decadência e prescrição",
    phaseLabel: "Preliminares",
    placeholder: "Prazos da pretensão punitiva (Decreto 47.383/2018).",
  },
  {
    id: "meritoInexistenciaFato",
    label: "Mérito — inexistência do fato",
    phaseLabel: "Mérito",
    placeholder: "Demonstração de que a conduta não ocorreu.",
  },
  {
    id: "meritoAtipicidade",
    label: "Mérito — atipicidade",
    phaseLabel: "Mérito",
    placeholder: "Ausência de tipificação ou de dano.",
  },
  {
    id: "meritoAusenciaAutoria",
    label: "Mérito — ausência de autoria",
    phaseLabel: "Mérito",
    placeholder: "Responsabilidade de terceiro ou ilegitimidade passiva.",
  },
  {
    id: "meritoRegularidadeAtividade",
    label: "Mérito — regularidade / licença",
    phaseLabel: "Mérito",
    placeholder: "Licença, outorga, CAR, TAC cumprido.",
  },
  {
    id: "atenuantes",
    label: "Atenuantes (subsidiário)",
    phaseLabel: "Subsidiário",
    placeholder: "Colaboração, reparação, primariedade ambiental.",
  },
  {
    id: "conversaoMulta",
    label: "Conversão de multa (subsidiário)",
    phaseLabel: "Subsidiário",
    placeholder: "Serviços ambientais, PECMA quando cabível.",
  },
  {
    id: "pedidos",
    label: "Pedidos finais",
    phaseLabel: "Pedidos",
    placeholder: "Anulação, arquivamento, redução, desembargo, produção de provas.",
  },
];

export function applyPetitionModel(
  modelId: PetitionModelId,
  current: Partial<Record<PetitionSectionId, string>>,
  mode: "replace_empty" | "append",
): Partial<Record<PetitionSectionId, string>> {
  const model = PETITION_MODELS.find((m) => m.id === modelId);
  if (!model) return current;
  const next = { ...current };
  for (const [key, starter] of Object.entries(model.sectionStarters) as Array<
    [PetitionSectionId, string]
  >) {
    const prev = (next[key] || "").trim();
    if (mode === "replace_empty" && prev) continue;
    next[key] = mode === "append" && prev ? `${prev}\n\n${starter}` : starter;
  }
  return next;
}
