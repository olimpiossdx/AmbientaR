import { normalizeCpfCnpj } from "@/lib/cpf-cnpj";
import type { ListaAgenteHit, ListaAgenteRegistro } from "@/lib/socioambiental/listas-agente-types";

const MTE_CSV_URL =
  "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-de-escravo/cadastro_de_empregadores.csv";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type MteIndex = {
  fetchedAt: number;
  byDocument: Map<string, ListaAgenteRegistro[]>;
};

let cache: MteIndex | null = null;

function parseCsvLine(line: string): string[] {
  return line.split(";").map((c) => c.trim());
}

function documentFromMteCell(cell: string): string {
  return normalizeCpfCnpj(cell);
}

async function loadMteIndex(): Promise<MteIndex> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  const response = await fetch(MTE_CSV_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/csv, text/plain, */*",
      "User-Agent": "AmbientaR/1.0 (consultoria ambiental; lista MTE)",
    },
  });

  if (!response.ok) {
    throw new Error(`Lista MTE indisponível (HTTP ${response.status}).`);
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const byDocument = new Map<string, ListaAgenteRegistro[]>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    if (cols.length < 6) continue;
    const uf = cols[2] ?? "";
    const empregador = cols[3] ?? "";
    const doc = documentFromMteCell(cols[4] ?? "");
    if (doc.length !== 11 && doc.length !== 14) continue;

    const registro: ListaAgenteRegistro = {
      rotulo: empregador,
      data: cols[9] ?? cols[1],
      uf: uf || undefined,
    };

    const prev = byDocument.get(doc) ?? [];
    prev.push(registro);
    byDocument.set(doc, prev);
  }

  cache = { fetchedAt: Date.now(), byDocument };
  return cache;
}

export async function consultarMteTrabalhoEscravo(
  documento: string,
): Promise<ListaAgenteHit> {
  const digits = normalizeCpfCnpj(documento);
  const consultadoEmUtc = new Date().toISOString();
  const fonte = {
    nome: "Lista Suja MTE",
    url: MTE_CSV_URL,
    consultadoEmUtc,
  };

  if (digits.length !== 11 && digits.length !== 14) {
    return {
      criterioId: "mte_trabalho_escravo",
      resultado: "Não Analisado",
      detalhe: "CPF/CNPJ do agente inválido ou não informado.",
      fonte,
    };
  }

  try {
    const index = await loadMteIndex();
    const registros = index.byDocument.get(digits);
    if (!registros?.length) {
      return {
        criterioId: "mte_trabalho_escravo",
        resultado: "Apto",
        detalhe: "Documento não consta na Lista Suja do trabalho escravo (MTE).",
        fonte,
      };
    }

    return {
      criterioId: "mte_trabalho_escravo",
      resultado: "Inapto",
      detalhe: `Consta na Lista Suja MTE (${registros.length} registro(s)).`,
      fonte,
      registros: registros.slice(0, 5),
    };
  } catch (e) {
    return {
      criterioId: "mte_trabalho_escravo",
      resultado: "Não Analisado",
      detalhe:
        e instanceof Error
          ? e.message
          : "Falha ao consultar Lista Suja MTE.",
      fonte,
    };
  }
}
