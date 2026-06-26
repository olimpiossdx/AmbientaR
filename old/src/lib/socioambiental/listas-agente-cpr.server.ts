import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/cpf-cnpj";
import { consultarIbamaEmbargoLista } from "@/lib/socioambiental/listas-agente-ibama.server";
import { consultarIcmbioEmbargoLista } from "@/lib/socioambiental/listas-agente-icmbio.server";
import { consultarMteTrabalhoEscravo } from "@/lib/socioambiental/listas-agente-mte.server";
import type { ListaAgenteHit } from "@/lib/socioambiental/listas-agente-types";

export async function consultarRestricaoBeneficiarioCpr(
  beneficiarios: string[],
): Promise<ListaAgenteHit> {
  const consultadoEmUtc = new Date().toISOString();
  const validos = beneficiarios.filter((d) => isValidCpfCnpj(d));

  if (!validos.length) {
    return {
      criterioId: "restricao_beneficiario_cpr",
      resultado: "Não Analisado",
      detalhe:
        "Informe CPF/CNPJ dos beneficiários da CPR (um por linha ou separados por vírgula).",
    };
  }

  const bloqueios: string[] = [];
  const alertas: string[] = [];

  for (const doc of validos) {
    const [mte, ibama, icmbio] = await Promise.all([
      consultarMteTrabalhoEscravo(doc),
      consultarIbamaEmbargoLista(doc),
      consultarIcmbioEmbargoLista(doc),
    ]);
    const mask = formatCpfCnpj(doc) || doc;
    if (
      mte.resultado === "Inapto" ||
      ibama.resultado === "Inapto" ||
      icmbio.resultado === "Inapto"
    ) {
      bloqueios.push(mask);
    } else if (
      mte.resultado === "Alerta" ||
      ibama.resultado === "Alerta" ||
      icmbio.resultado === "Alerta"
    ) {
      alertas.push(mask);
    }
  }

  if (bloqueios.length) {
    return {
      criterioId: "restricao_beneficiario_cpr",
      resultado: "Inapto",
      detalhe: `Beneficiário(s) com restrição em listas: ${bloqueios.join(", ")}.`,
    };
  }

  if (alertas.length) {
    return {
      criterioId: "restricao_beneficiario_cpr",
      resultado: "Alerta",
      detalhe: `Beneficiário(s) com alerta em listas: ${alertas.join(", ")}.`,
    };
  }

  return {
    criterioId: "restricao_beneficiario_cpr",
    resultado: "Apto",
    detalhe: `${validos.length} beneficiário(s) sem restrição nas listas MTE/IBAMA/ICMBio consultadas.`,
  };
}
