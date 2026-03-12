'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

type FirebaseInstances = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [instances, setInstances] = useState<FirebaseInstances | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      import('@/firebase/load-firebase-client'),
      import('@/firebase/config'),
    ])
      .then(([{ getInstances }, { firebaseConfig }]) => {
        const { app, auth, firestore } = getInstances(firebaseConfig);
        setInstances({
          firebaseApp: app as unknown as FirebaseApp,
          auth: auth as unknown as Auth,
          firestore: firestore as unknown as Firestore,
        });
      })
      .catch((err) => {
        console.error('Firebase load error:', err);
        setError(err?.message ?? 'Falha ao carregar Firebase');
      });
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="text-center text-destructive">
          <p className="font-medium">Erro ao carregar Firebase</p>
          <p className="text-sm mt-2">{error}</p>
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
    </FirebaseProvider>
  );
}
