import { studyMapsAdminDb } from "@/lib/study-maps/admin";

const COL = "geo_ia_usage";

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Limite mensal de complementos geo com Gemini.
 * **0 ou omitido = gratuito ilimitado** (sem bloqueio na app).
 * Valor > 0 só para ambientes que queiram teto administrativo explícito.
 */
export function geminiGeoComplementMonthlyLimit(): number {
  const raw = process.env.GEO_IA_GEMINI_MONTHLY_LIMIT;
  if (raw === undefined || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/** Gemini na Etapa 2 é sempre oferta gratuita (sem quota aplicada). */
export function isGeminiGeoComplementUnlimited(): boolean {
  return geminiGeoComplementMonthlyLimit() === 0;
}

export async function getGeminiGeoComplementUsage(uid: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}> {
  const limit = geminiGeoComplementMonthlyLimit();
  const unlimited = limit === 0;
  const snap = await studyMapsAdminDb()
    .collection(COL)
    .doc(`${uid}_${monthKey()}`)
    .get();
  const used = snap.exists ? Number(snap.data()?.geminiComplements ?? 0) : 0;
  return {
    used,
    limit,
    remaining: unlimited ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - used),
    unlimited,
  };
}

export async function assertGeminiGeoComplementAllowed(uid: string): Promise<void> {
  if (isGeminiGeoComplementUnlimited()) return;
  const { remaining, limit } = await getGeminiGeoComplementUsage(uid);
  if (remaining <= 0) {
    throw new Error(
      `Limite mensal de complementos com Gemini atingido (${limit}/mês). Use DeepSeek ou aguarde o próximo mês.`,
    );
  }
}

/** Contagem opcional (estatística); não bloqueia quando Gemini é gratuito. */
export async function recordGeminiGeoComplement(uid: string): Promise<void> {
  const ref = studyMapsAdminDb().collection(COL).doc(`${uid}_${monthKey()}`);
  const { FieldValue } = await import("firebase-admin/firestore");
  await ref.set(
    {
      uid,
      month: monthKey(),
      geminiComplements: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
