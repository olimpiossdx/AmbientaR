import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { firebaseConfig } from "@/firebase/config";

/** Inicialização lazy — só em rotas API / Node. Usa ADC no GCP ou GOOGLE_APPLICATION_CREDENTIALS local. */
export function getStudyMapsAdminApp(): App {
  const apps = getApps();
  if (apps.length) return apps[0]!;
  return initializeApp({
    storageBucket: firebaseConfig.storageBucket,
    projectId: firebaseConfig.projectId,
  });
}

export function studyMapsAdminAuth() {
  return getAuth(getStudyMapsAdminApp());
}

export function studyMapsAdminDb() {
  return getFirestore(getStudyMapsAdminApp());
}

export function studyMapsAdminStorage() {
  return getStorage(getStudyMapsAdminApp());
}
