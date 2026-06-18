'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { sortFirestoreDocsForSelect } from '@/lib/sort-pt-br';
import { useFirestoreAuthReady } from '@/firebase/use-firestore-auth-ready';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const firestoreAuthReady = useFirestoreAuthReady();

  const queryKey = React.useMemo(() => {
    if (!memoizedTargetRefOrQuery) return null;
    if (memoizedTargetRefOrQuery.type === 'collection') {
      return (memoizedTargetRefOrQuery as CollectionReference).path;
    }
    // A simplified way to get a unique key for a query.
    return JSON.stringify((memoizedTargetRefOrQuery as unknown as InternalQuery)._query);
  }, [memoizedTargetRefOrQuery]);


  useEffect(() => {
    if (!memoizedTargetRefOrQuery || !firestoreAuthReady) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Directly use memoizedTargetRefOrQuery as it's assumed to be the final query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(
          sortFirestoreDocsForSelect(results as (ResultItemType & Record<string, unknown>)[]) as ResultItemType[],
        );
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        setError(error)
        setData(null)
        setIsLoading(false)

        if (error.code === 'permission-denied') {
          let path = 'unknown';
          try {
            if (memoizedTargetRefOrQuery.type === 'collection') {
              path = (memoizedTargetRefOrQuery as CollectionReference).path;
            } else {
              const internal = memoizedTargetRefOrQuery as unknown as InternalQuery;
              const canonical =
                internal._query?.path?.canonicalString?.() ??
                internal._query?.path?.toString?.();
              path = typeof canonical === 'string' && canonical ? canonical : 'query';
            }
          } catch {
            path = 'query';
          }

          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          })

          setError(contextualError)
          errorEmitter.emit('permission-error', contextualError);
        }
      }
    );

    return () => unsubscribe();
  }, [queryKey, memoizedTargetRefOrQuery, firestoreAuthReady]); // Re-run if key/object changes.
  
  return { data, isLoading, error };
}
