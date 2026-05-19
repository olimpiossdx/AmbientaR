import { UPLOAD_MAX_BYTES_DEFAULT } from "@/lib/upload-limits";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { effectiveMimeType } from "@/lib/file-mime";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "fauna-docs");
const MAX_FILE_SIZE = UPLOAD_MAX_BYTES_DEFAULT; // 15MB
const ALLOWED_TYPES = ["application/pdf"];

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    const type = effectiveMimeType(file).toLowerCase();
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Apenas arquivos PDF são permitidos." },
        { status: 400 },
      );
    }

    await ensureDir();

    const safeName = `${Date.now()}-${(file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const outPath = path.join(UPLOAD_DIR, safeName);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(outPath, Buffer.from(bytes));

    const publicUrl = `/uploads/fauna-docs/${safeName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e) {
    console.error("POST /api/uploads/fauna:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Falha ao salvar arquivo.",
      },
      { status: 500 },
    );
  }
}
