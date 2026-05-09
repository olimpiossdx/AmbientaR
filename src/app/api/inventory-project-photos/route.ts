import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ROOT_DIR = path.join(process.cwd(), 'public', 'inventory-project-photos');
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function sanitizeSegment(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function safeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
  const base = path.basename(name, path.extname(name)).replace(/[^a-zA-Z0-9_-]/g, '_');
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base || 'foto'}-${stamp}${safeExt}`;
}

async function ensureProjectDir(projectId: string) {
  const safeProject = sanitizeSegment(projectId);
  const projectDir = path.join(ROOT_DIR, safeProject);
  await fs.mkdir(projectDir, { recursive: true });
  return { safeProject, projectDir };
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId é obrigatório.' }, { status: 400 });
    }

    const { safeProject, projectDir } = await ensureProjectDir(projectId);
    const entries = await fs.readdir(projectDir).catch(() => []);
    const files = entries
      .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort()
      .map((name) => ({
        id: name,
        name,
        url: `/inventory-project-photos/${safeProject}/${name}`,
      }));

    return NextResponse.json({ success: true, files });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Falha ao listar fotos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get('projectId');
    const files = formData.getAll('files');

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ success: false, error: 'projectId é obrigatório.' }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const { safeProject, projectDir } = await ensureProjectDir(projectId);
    const uploaded: Array<{ id: string; name: string; url: string }> = [];

    for (const item of files) {
      if (!(item instanceof File) || !item.size) continue;
      const outputName = safeFileName(item.name);
      const outPath = path.join(projectDir, outputName);
      const bytes = await item.arrayBuffer();
      await fs.writeFile(outPath, Buffer.from(bytes));
      uploaded.push({
        id: outputName,
        name: outputName,
        url: `/inventory-project-photos/${safeProject}/${outputName}`,
      });
    }

    return NextResponse.json({ success: true, uploaded });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Falha ao enviar fotos.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body?.projectId as string | undefined;
    const fileId = body?.fileId as string | undefined;

    if (!projectId || !fileId) {
      return NextResponse.json({ success: false, error: 'projectId e fileId são obrigatórios.' }, { status: 400 });
    }

    const { projectDir } = await ensureProjectDir(projectId);
    const safeFileId = path.basename(fileId);
    const targetPath = path.join(projectDir, safeFileId);
    await fs.unlink(targetPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Falha ao remover foto.' },
      { status: 500 }
    );
  }
}
