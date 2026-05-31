import type { AppUser, UserRole } from "@/lib/types";
import type { SyncCollectionDescriptor, UserSyncManifest } from "./types";

const PORTAL_ROLES: ReadonlySet<UserRole> = new Set([
  "client",
  "cliente_autonomo",
  "representative",
  "consultor_representante",
]);

function collectDocumentKeys(user: AppUser): string[] {
  const keys = new Set<string>();
  const push = (v?: string | null) => {
    if (v && String(v).trim()) keys.add(String(v).trim());
  };
  push(user.userCpf);
  push(user.cpf);
  (user.cnpjs ?? []).forEach((c) => push(c));
  return Array.from(keys);
}

/**
 * Manifesto lógico do que o motor de sync deve priorizar para pull incremental.
 * Convive com o cache persistente do Firestore em `src/firebase/load-firebase-client.ts`:
 * este manifesto guia checkpoints e futuras queries; o SDK continua a cachear leituras.
 */
export function buildUserSyncManifest(user: AppUser | null): UserSyncManifest | null {
  if (!user?.uid) return null;

  const documentKeys = collectDocumentKeys(user);
  const base = {
    version: 1 as const,
    generatedAt: new Date().toISOString(),
    uid: user.uid,
    role: user.role,
    documentKeys,
  };

  if (!PORTAL_ROLES.has(user.role)) {
    return {
      ...base,
      collections: [],
    };
  }

  const collections: SyncCollectionDescriptor[] = [
    {
      key: "clients:portal",
      collectionId: "clients",
      label: "Clientes acessíveis ao portal (filtro por userId / CPF / CNPJ na engine)",
    },
    {
      key: "empreendedores:portal",
      collectionId: "empreendedores",
      label: "Empreendedores do portal",
    },
    {
      key: "inventarios:portal",
      collectionId: "inventarios",
      label: "Inventários / campo (ver docs/APP-OFFLINE-FASE5.md)",
    },
  ];

  return { ...base, collections };
}
