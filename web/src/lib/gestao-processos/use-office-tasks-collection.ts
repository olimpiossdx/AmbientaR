"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
  type FirestoreError,
  type Query,
} from "firebase/firestore";
import { useFirebase } from "@/firebase";
import type { WithId } from "@/firebase/firestore/use-collection";
import { useFirestoreAuthReady } from "@/firebase/use-firestore-auth-ready";
import { sortFirestoreDocsForSelect } from "@/lib/sort-pt-br";
import { getFirestoreErrorMessage } from "@/lib/firestore-payload";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";

export type UseOfficeTasksCollectionResult = {
  data: WithId<OfficeTask>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
};

function mergeOfficeTaskSnapshots(
  snapshots: Map<string, WithId<OfficeTask>[]>,
): WithId<OfficeTask>[] {
  const byId = new Map<string, WithId<OfficeTask>>();
  for (const list of snapshots.values()) {
    for (const task of list) {
      byId.set(task.id, task);
    }
  }
  const merged = Array.from(byId.values());
  return sortFirestoreDocsForSelect(
    merged as (WithId<OfficeTask> & Record<string, unknown>)[],
  ) as WithId<OfficeTask>[];
}

export function buildOfficeTasksQueries(
  firestore: Firestore,
  uid: string,
  canSeeAll: boolean,
): Query[] {
  const col = collection(firestore, "officeTasks");
  if (canSeeAll) return [col];
  return [
    query(col, where("assigneeUid", "==", uid)),
    query(col, where("createdByUid", "==", uid)),
    query(col, where("demandanteUid", "==", uid)),
  ];
}

/**
 * Assina tarefas avulsas respeitando as regras Firestore:
 * admin/gestor listam tudo; demais perfis só tarefas em que participam.
 */
export function useOfficeTasksCollection(
  enabled: boolean,
  uid: string | undefined,
  canSeeAll: boolean,
): UseOfficeTasksCollectionResult {
  const { firestore } = useFirebase();
  const firestoreAuthReady = useFirestoreAuthReady();
  const [data, setData] = React.useState<WithId<OfficeTask>[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<FirestoreError | Error | null>(null);

  const queryKey = React.useMemo(() => {
    if (!enabled || !uid?.trim() || !firestore) return null;
    return canSeeAll ? `all:${uid}` : `scoped:${uid}`;
  }, [enabled, uid, canSeeAll, firestore]);

  React.useEffect(() => {
    if (!queryKey || !firestore || !uid?.trim() || !firestoreAuthReady) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    const queries = buildOfficeTasksQueries(firestore, uid, canSeeAll);
    const snapshots = new Map<string, WithId<OfficeTask>[]>();
    const readyIndexes = new Set<number>();
    let firstError: FirestoreError | Error | null = null;

    const applyState = () => {
      if (!active) return;
      if (firstError) {
        setError(firstError);
        setData(null);
      } else {
        setData(mergeOfficeTaskSnapshots(snapshots));
        setError(null);
      }
      setIsLoading(false);
    };

    const unsubs = queries.map((q, index) =>
      onSnapshot(
        q,
        (snapshot) => {
          if (!active || firstError) return;
          const results: WithId<OfficeTask>[] = snapshot.docs.map((doc) => ({
            ...(doc.data() as OfficeTask),
            id: doc.id,
          }));
          snapshots.set(String(index), results);
          readyIndexes.add(index);
          setData(mergeOfficeTaskSnapshots(snapshots));
          if (readyIndexes.size >= queries.length) {
            setError(null);
            setIsLoading(false);
          }
        },
        (err: FirestoreError) => {
          if (!active) return;
          readyIndexes.add(index);
          if (err.code === "permission-denied") {
            const friendly = new Error(getFirestoreErrorMessage(err));
            friendly.name = "FirestorePermissionError";
            firstError = friendly;
          } else {
            firstError = err;
          }
          if (readyIndexes.size >= queries.length) {
            applyState();
          }
        },
      ),
    );

    return () => {
      active = false;
      for (const unsub of unsubs) unsub();
    };
  }, [queryKey, firestore, uid, canSeeAll, firestoreAuthReady]);

  return { data, isLoading, error };
}
