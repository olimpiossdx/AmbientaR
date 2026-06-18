"use client";

import React, { useState, useEffect, type ReactNode } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { FirebaseProvider } from "@/firebase/provider";
import {
  clearFirebaseClientInstancesCache,
  getInstances,
} from "@/firebase/load-firebase-client";
import { firebaseConfig } from "@/firebase/config";
import { registerIndexedDbQuotaWatcher } from "@/lib/browser-storage-recovery";
import { IndexedDbRecoveryBanner } from "@/components/indexeddb-recovery-banner";

interface FirebaseClientProviderProps {
  children: ReactNode;
}

type FirebaseInstances = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

function readInstances(): FirebaseInstances | null {
  try {
    const { app, auth, firestore } = getInstances(firebaseConfig);
    return {
      firebaseApp: app as unknown as FirebaseApp,
      auth: auth as unknown as Auth,
      firestore: firestore as unknown as Firestore,
    };
  } catch {
    return null;
  }
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [instances, setInstances] = useState<FirebaseInstances | null>(
    () => readInstances(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return registerIndexedDbQuotaWatcher();
  }, []);

  useEffect(() => {
    if (instances) return;

    let isDisposed = false;
    let didInitialize = false;
    setError(null);

    const timeout = window.setTimeout(() => {
      if (!isDisposed && !didInitialize) {
        setError(
          (prev) =>
            prev ?? "Tempo limite ao inicializar Firebase. Tente novamente.",
        );
      }
    }, 10000);

    try {
      const loaded = readInstances();
      if (!isDisposed && loaded) {
        didInitialize = true;
        window.clearTimeout(timeout);
        setInstances(loaded);
      }
    } catch (err) {
      console.error("Firebase load error:", err);
      if (!isDisposed) {
        window.clearTimeout(timeout);
        setError((err as Error)?.message ?? "Falha ao carregar Firebase");
      }
    }
    return () => {
      isDisposed = true;
      window.clearTimeout(timeout);
    };
  }, [instances]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="text-center text-destructive">
          <p className="font-medium">Erro ao carregar Firebase</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            type="button"
            onClick={() => {
              clearFirebaseClientInstancesCache();
              window.location.reload();
            }}
            className="mt-4 rounded-md border border-destructive px-3 py-1 text-sm hover:bg-destructive/10"
          >
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md border border-destructive px-3 py-1 text-sm hover:bg-destructive/10"
          >
            Recarregar aplicação
          </button>
        </div>
      </div>
    );
  }

  if (!instances) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando Firebase...</p>
        </div>
      </div>
    );
  }

  const { firebaseApp, auth, firestore } = instances;

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
      <IndexedDbRecoveryBanner />
    </FirebaseProvider>
  );
}
