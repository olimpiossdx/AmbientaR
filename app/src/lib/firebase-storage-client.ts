"use client";

import { getApp, getApps } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "@/firebase/config";

export function getFirebaseAppOrThrow() {
  if (typeof getApps === "function" && getApps().length === 0) {
    throw new Error("Firebase não inicializado. Recarregue a página.");
  }
  return getApp();
}

/** Storage do cliente com bucket explícito (evita falhas de resolução do bucket padrão). */
export function getClientFirebaseStorage(): FirebaseStorage {
  const app = getFirebaseAppOrThrow();
  const bucket = firebaseConfig.storageBucket?.trim();
  return bucket ? getStorage(app, bucket) : getStorage(app);
}
