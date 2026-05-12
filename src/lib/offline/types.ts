import type { UserRole } from "@/lib/types";

/** Uma coleção ou subconjunto a incluir no manifesto de pull incremental. */
export type SyncCollectionDescriptor = {
  /** Chave estável para checkpoints (ex.: `clients:byIds`). */
  key: string;
  /** Nome lógico da coleção Firestore. */
  collectionId: string;
  /** IDs de documentos a replicar (MVP: derivado do perfil). */
  documentIds?: string[];
  /** Descrição humana para logs / UI. */
  label?: string;
};

export type UserSyncManifest = {
  version: 1;
  generatedAt: string;
  uid: string;
  role: UserRole;
  /** Documentos CPF/CNPJ usados no filtro (normalizados onde aplicável). */
  documentKeys: string[];
  collections: SyncCollectionDescriptor[];
};

export type OutboxStatus = "pending" | "processing" | "done" | "error";

/** Operação genérica a repetir quando houver rede (Firestore ou replay de API). */
export type OutboxOperation = {
  id: string;
  kind: "firestore.set" | "firestore.update" | "firestore.delete" | "http_fetch";
  /** Caminho Firestore (ex.: `clients/abc`) ou URL relativa para http_fetch. */
  target: string;
  /** Corpo serializado (JSON). */
  payloadJson?: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  status: OutboxStatus;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
};

export type SyncCheckpoint = {
  key: string;
  lastSyncedAt: number | null;
  etag?: string;
};
