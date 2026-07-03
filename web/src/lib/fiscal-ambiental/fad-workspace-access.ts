import {
  assertFadWorkspaceAccess,
  getFadWorkspace,
} from "./workspace-service";
import type { FadWorkspace } from "./types";

export async function requireFadWorkspaceRead(
  workspaceId: string,
  uid: string,
  isAdmin: boolean,
): Promise<FadWorkspace> {
  const workspace = await getFadWorkspace(workspaceId);
  if (!workspace) {
    throw Object.assign(new Error("Workspace não encontrado."), { status: 404 });
  }
  const allowed = await assertFadWorkspaceAccess(workspace, uid, isAdmin);
  if (!allowed) {
    throw Object.assign(new Error("Sem permissão."), { status: 403 });
  }
  return workspace;
}

export async function requireFadWorkspaceAccess(
  workspaceId: string,
  uid: string,
  isAdmin: boolean,
): Promise<FadWorkspace> {
  const workspace = await requireFadWorkspaceRead(workspaceId, uid, isAdmin);
  if (!workspace.aoi) {
    throw Object.assign(new Error("Defina a área do imóvel antes de pedir imagens."), {
      status: 400,
    });
  }
  return workspace;
}
