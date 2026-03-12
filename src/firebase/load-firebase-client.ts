/**
 * Único ponto de entrada do Firebase no cliente.
 * Usa o SDK modular (sem compat) para evitar erros de resolução
 * como "Can't resolve '@firebase/auth/internal'".
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export type FirebaseConfig = Record<string, string>;

export function getInstances(config: FirebaseConfig) {
  const app = initializeApp(config);
  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}
