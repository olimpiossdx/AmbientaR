import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Empreendedor, MtrDeclaracao } from "@/lib/types";
import {
  fetchMtrSessionToken,
  mtrProxyPost,
  type MtrConsultaCdfResponse,
  type MtrCodigosBarrasResponse,
} from "@/lib/mtr/mtr-api-client";
import {
  formatMtrDateBr,
  formatMtrDateYmd,
  mtrLastMonthRange,
} from "@/lib/mtr/mtr-declaracao-utils";
import { buildMtrDeclaracaoInserts } from "@/lib/mtr/mtr-sync-payload";

export type MtrSyncCredentials = {
  pessoaCodigo: number;
  pessoaCnpj: string;
  usuarioCpf: string;
  senha: string;
};

export type MtrSyncResult = {
  added: number;
  skipped: number;
  cdfCount: number;
  manifestoCount: number;
};

async function existingExternalKeys(
  firestore: Firestore,
  empreendedorId: string,
): Promise<Set<string>> {
  const snap = await getDocs(
    query(
      collection(firestore, "mtrDeclaracoes"),
      where("empreendedorId", "==", empreendedorId),
    ),
  );
  const keys = new Set<string>();
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as MtrDeclaracao;
    if (data.externalCodigo && data.tipo) {
      keys.add(`${data.tipo}:${data.externalCodigo}`);
    }
  }
  return keys;
}

export function mtrCredentialsFromEmpreendedor(
  emp: Empreendedor,
): MtrSyncCredentials | null {
  const mtr = emp.mtrIntegracao;
  const cnpj = emp.cpfCnpj?.replace(/\D/g, "");
  if (!mtr?.pessoaCodigo || !mtr.usuarioCpf || !mtr.senha || !cnpj) {
    return null;
  }
  return {
    pessoaCodigo: mtr.pessoaCodigo,
    pessoaCnpj: cnpj,
    usuarioCpf: mtr.usuarioCpf.replace(/\D/g, ""),
    senha: mtr.senha,
  };
}

async function updateEmpreendedorSyncMeta(
  firestore: Firestore,
  empreendedorId: string,
  syncedAt: string,
  summary: string,
): Promise<void> {
  await updateDoc(doc(firestore, "empreendedores", empreendedorId), {
    "mtrIntegracao.lastSyncAt": syncedAt,
    "mtrIntegracao.lastSyncSummary": summary,
    "mtrIntegracao.lastSyncError": null,
  });
}

export async function syncMtrDeclaracoesForEmpreendedor(opts: {
  firestore: Firestore;
  empreendedorId: string;
  ownerId: string;
  sessionToken: string;
  credentials: MtrSyncCredentials;
  inicio?: Date;
  fim?: Date;
}): Promise<MtrSyncResult> {
  const range = mtrLastMonthRange();
  const inicio = opts.inicio ?? range.inicio;
  const fim = opts.fim ?? range.fim;
  const syncedAt = new Date().toISOString();

  const mtrToken = await fetchMtrSessionToken(opts.sessionToken, {
    pessoaCodigo: opts.credentials.pessoaCodigo,
    pessoaCnpj: opts.credentials.pessoaCnpj,
    usuarioCpf: opts.credentials.usuarioCpf,
    senha: opts.credentials.senha,
  });

  const cdfData = await mtrProxyPost<MtrConsultaCdfResponse>(
    opts.sessionToken,
    mtrToken,
    "/consultaListaCdf",
    {
      cdfDataInicial: formatMtrDateBr(inicio),
      cdfDataFinal: formatMtrDateBr(fim),
      cdfGeradorCodigo: null,
      cdfDestinadorCodigo: null,
    },
  );

  const manifestoPath = `/retornaListaCodigoBarasManifesto/${formatMtrDateYmd(inicio)}/${formatMtrDateYmd(fim)}`;
  const manifestoData = await mtrProxyPost<MtrCodigosBarrasResponse>(
    opts.sessionToken,
    mtrToken,
    manifestoPath,
  );

  const cdfList = cdfData.listaCdfDTO ?? [];
  const codigos = manifestoData.codigos ?? [];
  const existing = await existingExternalKeys(opts.firestore, opts.empreendedorId);
  const { inserts, skipped } = buildMtrDeclaracaoInserts({
    empreendedorId: opts.empreendedorId,
    ownerId: opts.ownerId,
    cdfList,
    manifestoCodigos: codigos,
    existingKeys: existing,
    inicio,
    fim,
    syncedAt,
  });

  const col = collection(opts.firestore, "mtrDeclaracoes");
  for (const insert of inserts) {
    await addDoc(col, {
      ...insert,
      createdAt: serverTimestamp(),
    });
  }

  const summary = `${inserts.length} novo(s), ${skipped} existente(s)`;
  await updateEmpreendedorSyncMeta(
    opts.firestore,
    opts.empreendedorId,
    syncedAt,
    summary,
  ).catch(() => undefined);

  return {
    added: inserts.length,
    skipped,
    cdfCount: cdfList.length,
    manifestoCount: codigos.length,
  };
}
