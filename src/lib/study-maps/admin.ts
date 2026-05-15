import type { App } from "firebase-admin/app";
import {
  adminAuth,
  adminDb,
  adminStorage,
  getFirebaseAdminApp,
} from "@/lib/firebase-admin";

/** @deprecated Use getFirebaseAdminApp — mantido para compatibilidade com mapas. */
export function getStudyMapsAdminApp(): App {
  return getFirebaseAdminApp();
}

export const studyMapsAdminAuth = adminAuth;
export const studyMapsAdminDb = adminDb;
export const studyMapsAdminStorage = adminStorage;
