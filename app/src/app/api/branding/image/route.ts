import { NextRequest, NextResponse } from 'next/server';
import {
  apiAuthErrorResponse,
  getBearerToken,
  requireAuthenticatedApi,
} from '@/lib/api-auth';
import {
  FirebaseAdminCredentialsError,
  hasFirebaseAdminCredentials,
} from '@/lib/firebase-admin';
import {
  isFirebaseStorageDownloadUrl,
  storagePathFromDownloadUrl,
} from '@/lib/storage-upload';

/** Prefixos do bucket permitidos no proxy same-origin (preview no browser e PDF). */
const ALLOWED_OBJECT_PREFIXES = ['branding/', 'inspections/'] as const;

function isAllowedStorageProxyUrl(url: string): boolean {
  const objectPath = storagePathFromDownloadUrl(url);
  if (!objectPath) return false;
  return ALLOWED_OBJECT_PREFIXES.some((prefix) => objectPath.startsWith(prefix));
}

/**
 * Proxy same-origin para ficheiros do Storage (branding, evidências de vistoria, etc.).
 * Evita CORS no browser ao pré-visualizar anexos e gerar PDFs com canvas/jsPDF.
 *
 * Em dev local sem Firebase Admin, permite proxy só para `branding/` (leitura pública no Storage).
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl?.trim()) {
    return NextResponse.json({ error: 'Parâmetro url é obrigatório.' }, { status: 400 });
  }

  const trimmed = rawUrl.trim();
  if (!isFirebaseStorageDownloadUrl(trimmed) || !isAllowedStorageProxyUrl(trimmed)) {
    return NextResponse.json({ error: 'URL de Storage não permitida.' }, { status: 403 });
  }

  const objectPath = storagePathFromDownloadUrl(trimmed)!;
  const isPublicBranding = objectPath.startsWith('branding/');

  try {
    await requireAuthenticatedApi(request);
  } catch (e) {
    const adminUnavailable =
      !hasFirebaseAdminCredentials() || e instanceof FirebaseAdminCredentialsError;
    const hasBearer = Boolean(getBearerToken(request));

    if (adminUnavailable && isPublicBranding) {
      console.warn(
        '[api/branding/image] Firebase Admin indisponível; proxy branding/ (leitura pública no Storage).',
      );
      if (!hasBearer) {
        // branding/* tem allow read: if true — não exige Bearer para o proxy same-origin.
      }
    } else {
      return apiAuthErrorResponse(e);
    }
  }

  try {
    const upstream = await fetch(trimmed, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Storage respondeu ${upstream.status}` },
        { status: 502 },
      );
    }

    const bytes = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[api/branding/image]', e);
    return NextResponse.json({ error: 'Falha ao obter imagem do Storage.' }, { status: 502 });
  }
}
