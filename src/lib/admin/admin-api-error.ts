import { ADMIN_CREDENTIALS_ERROR_CODE } from "@/lib/admin/firebase-admin-setup";
import { FirebaseAdminCredentialsError } from "@/lib/firebase-admin";

export function adminApiErrorStatus(message: string): number {
  if (
    message.includes("Token") ||
    message.includes("permissão") ||
    message.includes("Sem permissão")
  ) {
    return 403;
  }
  if (message.includes("Credenciais do Firebase Admin")) {
    return 503;
  }
  return 500;
}

export function adminApiErrorResponse(err: unknown): {
  message: string;
  status: number;
  code?: string;
} {
  const message =
    err instanceof Error ? err.message : "Erro desconhecido no servidor.";
  if (err instanceof FirebaseAdminCredentialsError) {
    return {
      message,
      status: 503,
      code: ADMIN_CREDENTIALS_ERROR_CODE,
    };
  }
  return {
    message,
    status: adminApiErrorStatus(message),
  };
}
