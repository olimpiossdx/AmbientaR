import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "signed-contracts",
);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["application/pdf", "application/octet-stream"];

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderRaw = (formData.get("folder") as string | null) || "";

    if (!file?.size) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Arquivo maior que ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        },
        { status: 400 },
      );
    }

    const type = file.type?.toLowerCase() || "";
    if (type && !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de arquivo inválido. Envie um PDF." },
        { status: 400 },
      );
    }

    await ensureDir();

    const safeFolder = folderRaw.replace(/[^a-zA-Z0-9._-]/g, "_") || "misc";
    const safeName = `${Date.now()}-${(file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const outPath = path.join(UPLOAD_DIR, safeFolder, safeName);
    await fs.mkdir(path.dirname(outPath), { recursive: true });

    const bytes = await file.arrayBuffer();
    await fs.writeFile(outPath, Buffer.from(bytes));

    const publicUrl = `/uploads/signed-contracts/${safeFolder}/${safeName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e) {
    console.error("POST /api/uploads/signed-contracts:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Falha ao salvar arquivo.",
      },
      { status: 500 },
    );
  }
}
