/**
 * Modelos de ofício — baseados em documentos da Pimenta Consultoria.
 * Referência: Ofício 033.2025 - TAC - Irineu.docx
 */

import type { OficioContentParts, OficioRecipientParts } from "@/lib/oficio-format";

export type OficioTemplateId = "tac_sem_ad";

export type OficioTemplateDefaults = OficioContentParts &
  OficioRecipientParts & {
    recipientAddress?: string;
    signatoryProcuracao?: string;
    processoSei?: string;
    referente?: string;
  };

/** Termo de Ajustamento de Conduta — solicitação de assinatura (modelo 033/2025). */
export const OFICIO_TEMPLATE_TAC_SEMAD: OficioTemplateDefaults = {
  recipientSalutation: "Ao",
  recipientName:
    "Superintendente Regional da Unidade de Regularização Ambiental - URA/NOR",
  recipientRole: "",
  recipientOrganization: "",
  recipientAddress:
    "Rua Jovino Rodrigues Santana, nº 10 - Bairro Bela Vista\nUnaí/MG - CEP 38610-000",
  recipientCity: "",
  referente: "Solicitação de assinatura de Termo de Ajustamento de Conduta",
  processoSei: "2023.06.01.003.0004632",
  subject: "Solicitação de assinatura de TAC",
  reference: "",
  greeting: "Prezado(s) Senhores(s),",
  body: `Venho, por meio deste, solicitar a celebração de Termo de Ajustamento de Conduta (TAC) com o objetivo de dar continuidade às operações, em parte da área do empreendimento [NOME DO EMPREENDIMENTO] com sede no município de [MUNICÍPIO]-MG, e a regularização ambiental junto ao órgão/entidade competente, conforme requerimento a seguir delineado.

CONSIDERANDO, que o ciclo agrícola mostra-se indispensável à utilização imediata da área, no total de [ÁREA EM ha] ha, para desenvolvimento das atividades de [ATIVIDADES].

CONSIDERANDO que o art. 16, § 9º, da Lei Estadual nº 7.772, de 08 de setembro de 1980, prevê que ao infrator que estiver exercendo atividade sem a licença ou a autorização competente, além das demais penalidades cabíveis, será aplicada penalidade de suspensão de atividades, a qual prevalecerá até que o infrator obtenha a licença ou autorização devida ou firme termo de ajustamento de conduta com o órgão ambiental, com as condições e prazos para o funcionamento do empreendimento até a sua regularização;

CONSIDERANDO o que preconiza o Decreto Estadual nº 47.383, de 02 de março de 2018:
Art. 32. A atividade ou o empreendimento em instalação ou em operação sem a devida licença ambiental deverá regularizar-se por meio do licenciamento ambiental em caráter corretivo, mediante comprovação da viabilidade ambiental, que dependerá da análise dos documentos, projetos e estudos exigíveis para a obtenção das licenças anteriores.

§ 1º A continuidade de instalação ou operação da atividade ou do empreendimento dependerá da assinatura de Termo de Ajustamento de Conduta - TAC junto ao órgão ambiental competente, independentemente da formalização do processo de licenciamento.

CONSIDERANDO, ainda, que em 09/08/2021, o Memorando-Circular nº 7/2021/SEMAD/GAB, informa do acordão proferido no âmbito do processo nº 1.0000.20.589108-/002, que decidiu a lide, com a manutenção da prerrogativa de assinatura de TAC's, conforme previsão na Resolução Semad nº 3.043/2021, que dispõe sobre a delegação de competência para celebração de Termo de Ajustamento de Conduta, tanto para novos termos, quanto para pedidos de aditivos.`,
  attachments: "dos documentos pessoais do representante do empreendimento.",
  solicitante: `[NOME COMPLETO], nacionalidade brasileira, [PROFISSÃO/CATEGORIA], inscrito no CPF nº [CPF] e C.I. [RG] [ÓRGÃO/UF], residente na [ENDEREÇO COMPLETO].`,
  closing: "Atenciosamente,",
  signatoryProcuracao: "[NOME DO RESPONSÁVEL — p/p]",
  municipio: "Unaí",
  estado: "MG",
};

export const OFICIO_TEMPLATES: Record<
  OficioTemplateId,
  { label: string; description: string; defaults: OficioTemplateDefaults }
> = {
  tac_sem_ad: {
    label: "TAC — assinatura (SEMAD/MG)",
    description:
      "Modelo Ofício 033/2025: solicitação de assinatura de TAC perante URA/NOR.",
    defaults: OFICIO_TEMPLATE_TAC_SEMAD,
  },
};
