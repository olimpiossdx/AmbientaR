import { FieldValue } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import {
  isMtrConfigured,
  mtrGetToken,
  mtrPost,
  type MtrTokenRequest,
} from "@/lib/mtr/mtr-client";
import type {
  MtrConsultaCdfResponse,
  MtrCodigosBarrasResponse,
} from "@/lib/mtr/mtr-api-client";
import {
  formatMtrDateBr,
  formatMtrDateYmd,
  mtrLastMonthRange,
} from "@/lib/mtr/mtr-declaracao-utils";
import { buildMtrDeclaracaoInserts } from "@/lib/mtr/mtr-sync-payload";
import type { Empreendedor, MtrDeclaracao } from "@/lib/types";
import { mtrCredentialsFromEmpreendedor } from "@/lib/mtr/mtr-sync-service";

const MAX_AUTO_PDF_PER_SYNC = 8;

export type MtrServerSyncItemResult = {
  empreendedorId: string;
  empreendedorName: string;
  added: number;
  skipped: number;
  pdfsAttached: number;
  error?: string;
};

async function loadExistingKeys(empreendedorId: string): Promise<Set<string>> {
  const snap = await adminDb()
    .collection("mtrDeclaracoes")
    .where("empreendedorId", "==", empreendedorId)
    .get();
  const keys = new Set<string>();
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as MtrDeclaracao;
    if (data.externalCodigo && data.tipo) {
      keys.add(`${data.tipo}:${data.externalCodigo}`);
    }
  }
  return keys;
}

async function uploadPdfBase64Admin(
  base64: string,
  storagePath: string,
): Promise<string> {
  const bucketName = firebaseConfig.storageBucket?.trim();
  if (!bucketName) throw new Error("Storage bucket não configurado.");
  const bytes = Buffer.from(base64, "base64");
  const bucket = adminStorage().bucket(bucketName);
  const file = bucket.file(storagePath);
  await file.save(bytes, {
    contentType: "application/pdf",
    metadata: { cacheControl: "public, max-age=3600" },
  });
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
  });
  return url;
}

async function attachPdfIfNeeded(
  docId: string,
  insert: { tipo: string; externalCodigo: string; empreendedorId: string },
  mtrToken: string,
): Promise<boolean> {
  const path =
    insert.tipo === "cdf"
      ? `/buscaPdfCdf/${insert.externalCodigo}`
      : `/buscaPdfManifestoPorCodigoBarras/${insert.externalCodigo}`;
  const data = await mtrPost<{ pdfBase64?: string }>(path, mtrToken);
  if (!data.pdfBase64) return false;
  const storagePath = `mtr-declaracao/${insert.empreendedorId}/${Date.now()}-${insert.externalCodigo}.pdf`;
  const fileUrl = await uploadPdfBase64Admin(data.pdfBase64, storagePath);
  await adminDb().collection("mtrDeclaracoes").doc(docId).update({ fileUrl });
  return true;
}

export async function syncMtrForEmpreendedorServer(opts: {
  empreendedor: Empreendedor;
  ownerId: string;
  autoBaixarPdf?: boolean;
}): Promise<MtrServerSyncItemResult> {
  const { empreendedor } = opts;
  const base: MtrServerSyncItemResult = {
    empreendedorId: empreendedor.id,
    empreendedorName: empreendedor.name,
    added: 0,
    skipped: 0,
    pdfsAttached: 0,
  };

  if (!isMtrConfigured()) {
    return { ...base, error: "MTR_CHAVE_FEAM não configurada no servidor." };
  }

  const credentials = mtrCredentialsFromEmpreendedor(empreendedor);
  if (!credentials) {
    return {
      ...base,
      error: "Credenciais MTR incompletas (código unidade, CPF usuário, senha, CNPJ).",
    };
  }

  const range = mtrLastMonthRange();
  const syncedAt = new Date().toISOString();

  try {
    const tokenRes = await mtrGetToken(credentials as MtrTokenRequest);
    const mtrToken = tokenRes.token;
    if (!mtrToken) {
      throw new Error(
        (tokenRes.retorno as string) || "Token MTR não retornado.",
      );
    }

    const cdfData = await mtrPost<MtrConsultaCdfResponse>(
      "/consultaListaCdf",
      mtrToken,
      {
        cdfDataInicial: formatMtrDateBr(range.inicio),
        cdfDataFinal: formatMtrDateBr(range.fim),
        cdfGeradorCodigo: null,
        cdfDestinadorCodigo: null,
      },
    );

    const manifestoPath = `/retornaListaCodigoBarasManifesto/${formatMtrDateYmd(range.inicio)}/${formatMtrDateYmd(range.fim)}`;
    const manifestoData = await mtrPost<MtrCodigosBarrasResponse>(
      manifestoPath,
      mtrToken,
    );

    const existingKeys = await loadExistingKeys(empreendedor.id);
    const { inserts, skipped } = buildMtrDeclaracaoInserts({
      empreendedorId: empreendedor.id,
      ownerId: opts.ownerId,
      cdfList: cdfData.listaCdfDTO ?? [],
      manifestoCodigos: manifestoData.codigos ?? [],
      existingKeys,
      inicio: range.inicio,
      fim: range.fim,
      syncedAt,
    });

    const col = adminDb().collection("mtrDeclaracoes");
    let pdfsAttached = 0;
    const shouldPdf =
      opts.autoBaixarPdf ?? empreendedor.mtrIntegracao?.autoBaixarPdf === true;

    for (const insert of inserts) {
      const ref = await col.add({
        ...insert,
        createdAt: FieldValue.serverTimestamp(),
      });
      if (
        shouldPdf &&
        pdfsAttached < MAX_AUTO_PDF_PER_SYNC &&
        insert.externalCodigo
      ) {
        try {
          const ok = await attachPdfIfNeeded(ref.id, insert, mtrToken);
          if (ok) pdfsAttached += 1;
        } catch (e) {
          console.warn("[MTR] PDF auto:", insert.externalCodigo, e);
        }
      }
    }

    const summary = `${inserts.length} novo(s), ${skipped} existente(s)`;
    await adminDb()
      .collection("empreendedores")
      .doc(empreendedor.id)
      .update({
        "mtrIntegracao.lastSyncAt": syncedAt,
        "mtrIntegracao.lastSyncSummary": summary,
        "mtrIntegracao.lastSyncError": FieldValue.delete(),
      });

    return {
      ...base,
      added: inserts.length,
      skipped,
      pdfsAttached,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await adminDb()
      .collection("empreendedores")
      .doc(empreendedor.id)
      .update({
        "mtrIntegracao.lastSyncError": msg.slice(0, 500),
      })
      .catch(() => undefined);
    return { ...base, error: msg };
  }
}

export async function syncMtrBatchServer(opts: {
  empreendedorIds?: string[];
  ownerId: string;
  onlyAutoEnabled?: boolean;
}): Promise<MtrServerSyncItemResult[]> {
  if (opts.empreendedorIds?.length === 1) {
    const docSnap = await adminDb()
      .collection("empreendedores")
      .doc(opts.empreendedorIds[0]!)
      .get();
    if (!docSnap.exists) return [];
    const emp = { id: docSnap.id, ...docSnap.data() } as Empreendedor;
    return [
      await syncMtrForEmpreendedorServer({
        empreendedor: emp,
        ownerId: opts.ownerId,
      }),
    ];
  }

  let empreendedores: Empreendedor[];
  if (opts.empreendedorIds && opts.empreendedorIds.length > 1) {
    const ids = opts.empreendedorIds.slice(0, 30);
    const snaps = await Promise.all(
      ids.map((id) => adminDb().collection("empreendedores").doc(id).get()),
    );
    empreendedores = snaps
      .filter((s) => s.exists)
      .map((s) => ({ id: s.id, ...s.data() }) as Empreendedor);
  } else {
    const snap = await adminDb().collection("empreendedores").limit(500).get();
    empreendedores = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Empreendedor,
    );
  }

  const targets = opts.onlyAutoEnabled
    ? empreendedores.filter((e) => e.mtrIntegracao?.autoSyncEnabled)
    : empreendedores;

  const results: MtrServerSyncItemResult[] = [];
  for (const emp of targets) {
    results.push(
      await syncMtrForEmpreendedorServer({
        empreendedor: emp,
        ownerId: opts.ownerId,
      }),
    );
  }
  return results;
}
