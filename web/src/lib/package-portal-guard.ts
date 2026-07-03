import type { Auth } from "firebase/auth";
import type { PortalModuleCollection } from "@/lib/package-limits";

export type PortalGuardResult =
  | { ok: true }
  | { ok: false; message: string };

/** Valida limite do plano antes de criar registo no portal (server action). */
export async function guardPortalPackageAction(
  auth: Auth | null | undefined,
  action:
    | "create_empreendimento"
    | "ambbot"
    | `create_module:${PortalModuleCollection}`,
): Promise<PortalGuardResult> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    return { ok: false, message: "Sessão inválida. Faça login novamente." };
  }

  const res = await fetch("/api/package/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  const data = (await res.json()) as { ok?: boolean; message?: string };
  if (data.ok) return { ok: true };
  return {
    ok: false,
    message: data.message ?? "Limite do plano atingido.",
  };
}
