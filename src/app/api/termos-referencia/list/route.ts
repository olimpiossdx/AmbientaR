/**
 * GET /api/termos-referencia/list?study=prada|ptrf
 *
 * Lista arquivos (.pdf, .docx, .dotx) da subpasta de termos de referência vinculada ao estudo.
 * Apenas estudos com vínculo no primeiro momento (prada, ptrf) retornam dados.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getTermosReferenciaPathForStudy } from '@/lib/termos-referencia-config';

const ALLOWED_EXT = ['.pdf', '.docx', '.dotx'];

function getAllDocFiles(dir: string, acc: string[] = []): string[] {
  // sync helper to collect paths; we'll stat in async
  return acc;
}

export async function GET(request: NextRequest) {
  const study = request.nextUrl.searchParams.get('study')?.trim();
  if (!study) {
    return NextResponse.json(
      { success: false, error: 'Parâmetro study é obrigatório (ex.: study=prada ou study=ptrf).' },
      { status: 400 }
    );
  }

  const dirPath = getTermosReferenciaPathForStudy(study);
  if (!dirPath) {
    return NextResponse.json(
      { success: false, error: `Estudo "${study}" não possui vínculo com pasta de termos de referência no primeiro momento.` },
      { status: 404 }
    );
  }

  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { success: false, error: 'Caminho não é uma pasta.', path: dirPath },
        { status: 400 }
      );
    }
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return NextResponse.json(
        { success: true, study, folder: path.basename(dirPath), path: dirPath, files: [], message: 'Pasta ainda não existe ou está vazia.' },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao acessar pasta.' },
      { status: 500 }
    );
  }

  const collected: { name: string; relativePath: string }[] = [];

  async function walk(currentDir: string, relativePrefix: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(currentDir, e.name);
      const rel = relativePrefix ? `${relativePrefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        await walk(full, rel);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (ALLOWED_EXT.includes(ext)) {
          collected.push({ name: e.name, relativePath: rel });
        }
      }
    }
  }

  await walk(dirPath, '');

  collected.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return NextResponse.json({
    success: true,
    study,
    folder: path.basename(dirPath),
    path: dirPath,
    files: collected,
  });
}
