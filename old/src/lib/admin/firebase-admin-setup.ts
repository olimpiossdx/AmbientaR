import { firebaseConfig } from "@/firebase/config";

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

export const FIREBASE_AUTH_USERS_CONSOLE_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/users`;

export const FIREBASE_SERVICE_ACCOUNTS_CONSOLE_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/settings/serviceaccounts/adminsdk`;

/** Caminho recomendado no Windows para esta cópia do repositório (E:\\A). */
export const WINDOWS_SERVICE_ACCOUNT_PATH = "E:\\A\\config\\firebase-service-account.json";

export const ADMIN_CREDENTIALS_ERROR_CODE = "ADMIN_CREDENTIALS_MISSING";

export function isAdminCredentialsMissing(
  status: number,
  code?: string,
): boolean {
  return (
    status === 503 ||
    code === ADMIN_CREDENTIALS_ERROR_CODE
  );
}
