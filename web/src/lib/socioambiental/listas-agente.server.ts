import { formatCpfCnpj, isValidCpfCnpj, normalizeCpfCnpj } from "@/lib/cpf-cnpj";
import {
  consultarIbamaAutuacoesLista,
  consultarIbamaEmbargoLista,
} from "@/lib/socioambiental/listas-agente-ibama.server";
import { consultarIcmbioEmbargoLista } from "@/lib/socioambiental/listas-agente-icmbio.server";
import { consultarRestricaoBeneficiarioCpr } from "@/lib/socioambiental/listas-agente-cpr.server";
import { consultarReservaLegalDocumento } from "@/lib/socioambiental/listas-agente-reserva-legal.server";
import { consultarMteTrabalhoEscravo } from "@/lib/socioambiental/listas-agente-mte.server";
import type {
  ListaAgenteHit,
  ListasAgenteResult,
} from "@/lib/socioambiental/listas-agente-types";

const LISTA_CRITERIO_IDS = new Set([
  "mte_trabalho_escravo",
  "ibama_embargo_lista",
  "icmbio_embargo_lista",
  "ibama_autuacoes_lista",
  "reserva_legal_documento",
  "restricao_beneficiario_cpr",
]);

export async function consultarListasAgente(params: {
  documento: string;
  criterioIds?: string[];
  codImovel?: string;
  beneficiariosCpr?: string[];
}): Promise<ListasAgenteResult> {
  const digits = normalizeCpfCnpj(params.documento);
  const consultadoEmUtc = new Date().toISOString();
  const wanted = new Set(
    (params.criterioIds ?? [...LISTA_CRITERIO_IDS]).filter((id) =>
      LISTA_CRITERIO_IDS.has(id),
    ),
  );

  const hits: ListaAgenteHit[] = [];

  const docValido = Boolean(digits && isValidCpfCnpj(digits));

  if (!docValido) {
    const tasks: Promise<ListaAgenteHit>[] = [];
    for (const id of wanted) {
      if (id === "reserva_legal_documento") {
        tasks.push(
          consultarReservaLegalDocumento({
            documento: digits,
            codImovel: params.codImovel,
          }),
        );
      } else if (id === "restricao_beneficiario_cpr") {
        tasks.push(
          consultarRestricaoBeneficiarioCpr(params.beneficiariosCpr ?? []),
        );
      } else {
        hits.push({
          criterioId: id,
          resultado: "Não Analisado",
          detalhe: "Informe CPF ou CNPJ válido do agente/tomador.",
        });
      }
    }
    if (tasks.length) hits.push(...(await Promise.all(tasks)));
    return {
      documento: digits,
      documentoMascarado: formatCpfCnpj(digits) || "—",
      consultadoEmUtc,
      hits,
    };
  }

  const tasks: Promise<ListaAgenteHit>[] = [];

  if (wanted.has("mte_trabalho_escravo")) {
    tasks.push(consultarMteTrabalhoEscravo(digits));
  }
  if (wanted.has("ibama_embargo_lista")) {
    tasks.push(consultarIbamaEmbargoLista(digits));
  }
  if (wanted.has("ibama_autuacoes_lista")) {
    tasks.push(consultarIbamaAutuacoesLista(digits));
  }
  if (wanted.has("icmbio_embargo_lista")) {
    tasks.push(consultarIcmbioEmbargoLista(digits));
  }
  if (wanted.has("reserva_legal_documento")) {
    tasks.push(
      consultarReservaLegalDocumento({
        documento: digits,
        codImovel: params.codImovel,
      }),
    );
  }
  if (wanted.has("restricao_beneficiario_cpr")) {
    tasks.push(
      consultarRestricaoBeneficiarioCpr(params.beneficiariosCpr ?? []),
    );
  }

  hits.push(...(await Promise.all(tasks)));

  return {
    documento: digits,
    documentoMascarado: formatCpfCnpj(digits),
    consultadoEmUtc,
    hits,
  };
}
