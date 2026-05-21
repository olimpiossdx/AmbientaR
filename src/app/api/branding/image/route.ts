import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOST_SNIPPETS = [
  'firebasestorage.googleapis.com',
  'firebasestorage.app',
];

const PROJECT_BUCKET = 'studio-316805764-e4d13';

function isAllowedBrandingStorageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!ALLOWED_HOST_SNIPPETS.some((h) => u.hostname.includes(h))) {
      return false;
    }
    if (!u.pathname.includes(PROJECT_BUCKET) && !u.hostname.includes(PROJECT_BUCKET)) {
      return false;
    }
    const parts = u.pathname.split('/');
    const oIdx = parts.indexOf('o');
    if (oIdx < 0 || !parts[oIdx + 1]) return false;
    const objectPath = decodeURIComponent(parts[oIdx + 1]);
    return objectPath.startsWith('branding/');
  } catch {
    return false;
  }
}

/**
 * Proxy same-origin para imagens de branding no Storage.
 * Evita CORS no browser (localhost / produção) ao gerar PDFs com canvas/jsPDF.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl?.trim()) {
    return NextResponse.json({ error: 'Parâmetro url é obrigatório.' }, { status: 400 });
  }

  const trimmed = rawUrl.trim();
  if (!isAllowedBrandingStorageUrl(trimmed)) {
    return NextResponse.json({ error: 'URL de branding não permitida.' }, { status: 403 });
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
