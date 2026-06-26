import { NextResponse } from "next/server";
import {
  createFadWorkspace,
  listFadWorkspacesForOwner,
} from "@/lib/fiscal-ambiental/workspace-service";
import { parseCreateWorkspaceBody } from "@/lib/fiscal-ambiental/validators";
import { handleFadApiError, requireFadApiAuth } from "../_fad-api-guard";

export async function GET(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const workspaces = await listFadWorkspacesForOwner(user.uid);
    return NextResponse.json({ ok: true, data: workspaces });
  } catch (err) {
    return handleFadApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = await req.json();
    const input = parseCreateWorkspaceBody(body);
    if (!input) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_BODY", message: "Nome do imóvel é obrigatório (até 200 caracteres)." },
        },
        { status: 400 },
      );
    }

    const workspace = await createFadWorkspace(user.uid, input);
    return NextResponse.json({ ok: true, data: workspace }, { status: 201 });
  } catch (err) {
    return handleFadApiError(err);
  }
}
