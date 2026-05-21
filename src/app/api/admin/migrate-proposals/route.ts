import { NextRequest, NextResponse } from 'next/server';
import { adminApiErrorResponse } from '@/lib/admin/admin-api-error';
import { verifyAdminBearer } from '@/lib/admin/verify-admin';
import { adminDb, formatFirebaseAdminError } from '@/lib/firebase-admin';

/**
 * Migra documentos da coleção legada `proposals` → `commercialProposals`.
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdminBearer(req.headers.get('authorization'));
    const db = adminDb();
    const legacy = await db.collection('proposals').get();
    if (legacy.empty) {
      return NextResponse.json({ migrated: 0, message: 'Nenhum orçamento legado encontrado.' });
    }

    let migrated = 0;
    for (const docSnap of legacy.docs) {
      const targetRef = db.collection('commercialProposals').doc(docSnap.id);
      const target = await targetRef.get();
      if (!target.exists) {
        await targetRef.set({
          ...docSnap.data(),
          migratedFrom: 'proposals',
          migratedAt: new Date().toISOString(),
        });
        migrated += 1;
      }
    }

    return NextResponse.json({
      migrated,
      totalLegacy: legacy.size,
      message: `${migrated} documento(s) copiado(s) para commercialProposals.`,
    });
  } catch (e) {
    const { message, status, code } = adminApiErrorResponse(formatFirebaseAdminError(e));
    return NextResponse.json({ success: false, error: message, code }, { status });
  }
}
