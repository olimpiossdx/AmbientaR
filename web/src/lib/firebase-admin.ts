import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { firebaseConfig } from "@/firebase/config";

const DEFAULT_SERVICE_ACCOUNT_PATH = resolve(
  process.cwd(),
  "config/firebase-service-account.json",
);

/** Erro amigável quando não há credenciais no ambiente local. */
export class FirebaseAdminCredentialsError extends Error {
  constructor(detail?: string) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    const defaultPath = DEFAULT_SERVICE_ACCOUNT_PATH;
    super(
      detail ||
        "Credenciais do Firebase Admin não configuradas neste ambiente. " +
          "No .env.local não basta o caminho: é obrigatório o ficheiro JSON no disco. " +
          (credPath
            ? `Caminho configurado (inexistente?): ${credPath}. `
            : "") +
          `Copie a chave da Firebase Console para ${defaultPath} ` +
          "(Contas de serviço → Gerar nova chave privada). " +
          'Alternativa: FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...} numa linha. ' +
          "Depois reinicie npm run dev. Ver config/README.md.",
    );
    this.name = "FirebaseAdminCredentialsError";
  }
}

function parseServiceAccountJson(raw: string, source: string): ServiceAccount {
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error(
      `JSON inválido em ${source}. Verifique FIREBASE_SERVICE_ACCOUNT_KEY ou o ficheiro da conta de serviço.`,
    );
  }
}

function loadServiceAccountFromDisk(filePath: string): ServiceAccount | null {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return null;
  return parseServiceAccountJson(
    readFileSync(resolved, "utf8"),
    filePath,
  );
}

/** Resolve credenciais explícitas (env ou ficheiro local). Sem isto usa ADC no GCP. */
export function resolveServiceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (inline) {
    return parseServiceAccountJson(
      inline,
      "FIREBASE_SERVICE_ACCOUNT_KEY",
    );
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const pathsToTry = [
    ...(credPath ? [credPath] : []),
    DEFAULT_SERVICE_ACCOUNT_PATH,
  ].filter((p, i, arr) => arr.indexOf(p) === i);

  for (const filePath of pathsToTry) {
    const fromDisk = loadServiceAccountFromDisk(filePath);
    if (fromDisk) return fromDisk;
  }

  if (credPath) {
    throw new FirebaseAdminCredentialsError(
      `GOOGLE_APPLICATION_CREDENTIALS aponta para um ficheiro que não existe: ${credPath}. ` +
        "Descarregue o JSON em Firebase Console → Contas de serviço → Gerar nova chave e copie para esse caminho.",
    );
  }

  return null;
}

/** Indica se há credenciais explícitas (env ou ficheiro local). ADC no GCP não conta. */
export function hasFirebaseAdminCredentials(): boolean {
  try {
    return resolveServiceAccount() !== null;
  } catch {
    return false;
  }
}

function isDefaultCredentialsMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not load the default credentials") ||
    lower.includes("unable to detect a project id") ||
    lower.includes("application default credentials")
  );
}

/** Converte erros do SDK Admin em mensagens em português para a UI. */
export function formatFirebaseAdminError(err: unknown): Error {
  if (err instanceof FirebaseAdminCredentialsError) return err;

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Erro desconhecido no servidor.";

  if (isDefaultCredentialsMessage(message)) {
    return new FirebaseAdminCredentialsError();
  }

  return err instanceof Error ? err : new Error(message);
}

/**
 * App Firebase Admin (rotas API / Node apenas).
 * Credenciais: FIREBASE_SERVICE_ACCOUNT_KEY, GOOGLE_APPLICATION_CREDENTIALS,
 * config/firebase-service-account.json, ou ADC no GCP (App Hosting, Cloud Run).
 */
export function getFirebaseAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0]!;

  const serviceAccount = resolveServiceAccount();
  const appOptions = {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
  };

  try {
    return initializeApp(appOptions);
  } catch (err) {
    throw formatFirebaseAdminError(err);
  }
}

export function adminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function adminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function adminStorage() {
  return getStorage(getFirebaseAdminApp());
}
