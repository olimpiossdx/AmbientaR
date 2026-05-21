import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOST_SNIPPETS = [
  'firebasestorage.googleapis.com',
  'firebasestorage.app',
];

const PROJECT_BUCKET = 'studio-316805764-e4d13';

/** Prefixos do bucket permitidos no proxy same-origin (preview no browser e PDF). */
const ALLOWED_OBJECT_PREFIXES = ['branding/', 'inspections/'] as const;

function objectPathFromStorageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!ALLOWED_HOST_SNIPPETS.some((h) => u.hostname.includes(h))) {
      return null;
    }
    if (!u.pathname.includes(PROJECT_BUCKET) && !u.hostname.includes(PROJECT_BUCKET)) {
      return null;
    }
    const parts = u.pathname.split('/');
    const oIdx = parts.indexOf('o');
    if (oIdx < 0 || !parts[oIdx + 1]) return null;
    return decodeURIComponent(parts[oIdx + 1]);
  } catch {
    return null;
  }
}

function isAllowedStorageProxyUrl(url: string): boolean {
  const objectPath = objectPathFromStorageUrl(url);
  if (!objectPath) return false;
  return ALLOWED_OBJECT_PREFIXES.some((prefix) => objectPath.startsWith(prefix));
}

/**
 * Proxy same-origin para ficheiros do Storage (branding, evidências de vistoria, etc.).
 * Evita CORS no browser ao pré-visualizar anexos e gerar PDFs com canvas/jsPDF.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl?.trim()) {
    return NextResponse.json({ error: 'Parâmetro url é obrigatório.' }, { status: 400 });
  }

  const trimmed = rawUrl.trim();
  if (!isAllowedStorageProxyUrl(trimmed)) {
    return NextResponse.json({ error: 'URL de Storage não permitida.' }, { status: 403 });
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
