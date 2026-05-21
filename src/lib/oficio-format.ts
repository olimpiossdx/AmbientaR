/** Valores padrão e composição de texto para ofícios (formato Pimenta Consultoria). */



import { format } from "date-fns";

import { ptBR } from "date-fns/locale/pt-BR";



export const OFICIO_HEADER_PREFIX = "OF/PIMENTAAMBIENTAL/";



export const OFICIO_SALUTATION_OPTIONS = [

  { value: "Ao Senhor", label: "Ao Senhor" },

  { value: "À Senhora", label: "À Senhora" },

  { value: "Ao(À)", label: "Ao(À)" },

  { value: "Ao", label: "Ao (bloco final — órgão público)" },

] as const;



/** Saudação no corpo (após metadados). */

export const DEFAULT_OFICIO_GREETING = "Prezado(s) Senhores(s),";

export const DEFAULT_OFICIO_CLOSING = "Atenciosamente,";



export type OficioRecipientParts = {

  recipientSalutation?: string;

  recipientName?: string;

  recipientRole?: string;

  recipientOrganization?: string;

  recipientCity?: string;

  /** Endereço do destinatário (linhas após cargo/órgão). */

  recipientAddress?: string;

  /** Campo legado (texto único). */

  recipient?: string;

};



/** Monta o bloco de destinatário (formato legado — início do texto). */

export function composeOficioRecipient(parts: OficioRecipientParts): string {

  const name = parts.recipientName?.trim();

  const salutation = parts.recipientSalutation?.trim();

  const role = parts.recipientRole?.trim();

  const org = parts.recipientOrganization?.trim();

  const city = parts.recipientCity?.trim();



  const lines: string[] = [];

  if (salutation && name) {

    lines.push(`${salutation} ${name},`);

  } else if (name) {

    lines.push(`${name},`);

  } else if (salutation) {

    lines.push(`${salutation},`);

  }

  if (role) lines.push(role);

  if (org) lines.push(org);

  if (city) lines.push(city);



  if (lines.length > 0) return lines.join("\n");

  return parts.recipient?.trim() || "";

}



/**

 * Bloco final do destinatário (modelo consolidado Word).

 * Ex.: Ao / Superintendente... / Rua... / Unaí/MG - CEP

 */

export function composeOficioRecipientEnd(parts: OficioRecipientParts): string {

  const salutation = parts.recipientSalutation?.trim() || "Ao";

  const name = parts.recipientName?.trim();

  const role = parts.recipientRole?.trim();

  const org = parts.recipientOrganization?.trim();

  const address = parts.recipientAddress?.trim();

  const city = parts.recipientCity?.trim();



  const lines: string[] = [];

  const aoBlock = salutation === "Ao" || salutation === "À";

  if (aoBlock) {

    lines.push(salutation);

    if (name) lines.push(name);

  } else if (salutation && name) {

    lines.push(`${salutation} ${name}`);

  } else if (name) {

    lines.push(name);

  } else {

    lines.push(salutation);

  }



  if (role) lines.push(role);

  if (org) lines.push(org);

  if (address) {

    address.split(/\r?\n/).forEach((line) => {

      const t = line.trim();

      if (t) lines.push(t);

    });

  }

  if (city) lines.push(city);



  return lines.join("\n");

}



export type OficioContentParts = {

  subject?: string;

  /** Linha "Referente:" do modelo Word. */

  referente?: string;

  /** Linha "Processo SEI/SLA:" (ou referência processual). */

  processoSei?: string;

  reference?: string;

  greeting?: string;

  body?: string;

  closing?: string;

  attachments?: string;

  /** Parágrafo "Por fim, dados do solicitante/responsável legal". */

  solicitante?: string;

  /** Linha de assinatura "p/p Nome" (responsável legal / cliente). */

  signatoryProcuracao?: string;

  municipio?: string;

  estado?: string;

  assinanteNome?: string;

  assinanteCargo?: string;

  oficioNumber?: string;

  dataEmissao?: string | Date;

};



/** Número no padrão do arquivo modelo: OF/PIMENTAAMBIENTAL/ Nº 033/2025 */

export function formatOficioOfficialNumber(oficioNumber?: string): string {

  if (!oficioNumber?.trim()) return `${OFICIO_HEADER_PREFIX} [nº ao concluir]`;

  const [seq, year] = oficioNumber.split("/");

  const padded = seq?.replace(/\D/g, "").padStart(3, "0") || seq;

  return `${OFICIO_HEADER_PREFIX} Nº ${padded}/${year || new Date().getFullYear()}`;

}



export function formatOficioEmissionLine(

  municipio?: string,

  estado?: string,

  data?: string | Date,

): string {

  const uf = estado?.trim() || "MG";

  const city = municipio?.trim() || "Unaí";

  const date =

    data instanceof Date

      ? data

      : data

        ? new Date(data)

        : new Date();

  const when = Number.isNaN(date.getTime())

    ? format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

    : format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return `${city}-${uf}, ${when}`;

}



/**

 * Texto consolidado para pré-visualização, impressão e cópia.

 * Ordem alinhada ao modelo Ofício 033.2025 - TAC - Irineu.docx.

 */

export function buildOficioConsolidatedText(

  parts: OficioContentParts & OficioRecipientParts,

): string {

  const blocks: string[] = [];



  const header = formatOficioOfficialNumber(parts.oficioNumber);

  const localDate = formatOficioEmissionLine(

    parts.municipio,

    parts.estado,

    parts.dataEmissao,

  );

  blocks.push(`${header}                          ${localDate}`);



  const referente =

    parts.referente?.trim() || parts.reference?.trim() || "";

  if (referente) {

    blocks.push("", `Referente: ${referente}`);

  }



  const processo = parts.processoSei?.trim();

  if (processo) {

    blocks.push(`Processo SEI/SLA: ${processo}`);

  } else if (parts.reference?.trim() && !parts.referente?.trim()) {

    blocks.push(`Referência: ${parts.reference.trim()}`);

  }



  if (parts.subject?.trim()) {

    blocks.push(`Assunto: ${parts.subject.trim()}`);

  }



  const greeting = parts.greeting?.trim() || DEFAULT_OFICIO_GREETING;

  blocks.push("", greeting);



  if (parts.body?.trim()) {

    blocks.push("", parts.body.trim());

  }



  if (parts.attachments?.trim()) {

    const annex = parts.attachments.trim();

    const line = annex.toLowerCase().startsWith("dos ") ||

      annex.toLowerCase().startsWith("da ") ||

      annex.toLowerCase().startsWith("de ")

      ? `Anexo, consta cópia: ${annex}`

      : `Anexo(s): ${annex}`;

    blocks.push("", line);

  }



  if (parts.solicitante?.trim()) {

    blocks.push(

      "",

      "Por fim, dados do solicitante/responsável legal:",

      "",

      parts.solicitante.trim(),

    );

  }



  const closing = parts.closing?.trim() || DEFAULT_OFICIO_CLOSING;

  blocks.push("", closing, "", "_____________________________________");



  const pp =

    parts.signatoryProcuracao?.trim() ||

    parts.assinanteNome?.trim();

  if (pp) {

    const line = pp.toLowerCase().startsWith("p/p")

      ? pp

      : `p/p ${pp}`;

    blocks.push(line);

  } else if (parts.assinanteNome?.trim()) {

    blocks.push(parts.assinanteNome.trim());

    if (parts.assinanteCargo?.trim()) {

      blocks.push(parts.assinanteCargo.trim());

    }

  }



  const recipientEnd = composeOficioRecipientEnd(parts);

  if (recipientEnd) {

    blocks.push("", recipientEnd);

  }



  return blocks.join("\n");

}



/** @deprecated Alias — use buildOficioConsolidatedText */

export function buildOficioPreviewText(

  parts: OficioContentParts & OficioRecipientParts,

): string {

  return buildOficioConsolidatedText(parts);

}



/** Preenche campos estruturados a partir de rascunho antigo (só `recipient`). */

export function legacyOficioRecipientDefaults(

  current?: OficioRecipientParts | null,

): Pick<OficioRecipientParts, "recipientSalutation" | "recipientName"> {

  if (current?.recipientName?.trim()) {

    return {

      recipientSalutation: current.recipientSalutation || "Ao Senhor",

      recipientName: current.recipientName,

    };

  }

  const legacy = current?.recipient?.trim();

  if (!legacy) {

    return { recipientSalutation: "Ao Senhor", recipientName: "" };

  }

  return { recipientSalutation: "Ao Senhor", recipientName: legacy };

}


