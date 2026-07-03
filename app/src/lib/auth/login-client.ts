import { isValidCpfCnpj, normalizeCpfCnpj } from "@/lib/cpf-cnpj";

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

export async function resolveLoginEmailFromIdentifier(
  identifier: string,
): Promise<string> {
  const trimmed = identifier.trim();
  if (isEmailIdentifier(trimmed)) {
    return trimmed.toLowerCase();
  }

  const res = await fetch("/api/auth/resolve-identifier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: trimmed }),
  });

  const data = (await res.json()) as { email?: string; error?: string };
  if (!res.ok || !data.email) {
    throw new Error(
      data.error || "E-mail/documento ou senha incorretos.",
    );
  }
  return data.email;
}

export function validateLoginIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isEmailIdentifier(trimmed)) {
    return /\S+@\S+\.\S+/.test(trimmed);
  }
  const digits = normalizeCpfCnpj(trimmed);
  return isValidCpfCnpj(digits);
}

export async function syncPostLogin(
  auth: import("firebase/auth").Auth | null | undefined,
): Promise<void> {
  try {
    const { getBearerApiHeaders } = await import("@/lib/api-client-auth");
    const headers = await getBearerApiHeaders(auth);
    await fetch("/api/auth/post-login-sync", {
      method: "POST",
      headers,
    });
  } catch {
    // não bloqueia login
  }
}
