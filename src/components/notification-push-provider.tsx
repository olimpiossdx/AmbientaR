"use client";

import * as React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { isUserProfileAlignedWithSession, useAuthUserId } from "@/lib/auth-user-id";
import type { Notification } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";
import { canAccessOfficeTasks } from "@/lib/gestao-processos/role-guards";
import { getPackageLimits } from "@/lib/package-limits";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { runClientPortalDeadlineAlerts } from "@/lib/client-deadline-alerts";
import { runOfficeTaskDeadlineAlerts } from "@/lib/gestao-processos/office-task-deadline-alerts";
import { registerDeviceFcmToken } from "@/lib/fcm-client";
import {
  canUseBrowserNotifications,
  requestBrowserNotificationPermission,
  showBrowserNotificationForAppAlert,
} from "@/lib/push-notifications";

/**
 * Escuta novas entradas em `users/{uid}/notifications` e dispara alerta nativo (PWA/celular).
 * Também verifica prazos de multas/defesas para o portal do cliente.
 */
export function NotificationPushProvider() {
  const { firestore, auth, user } = useFirebase();
  const sessionUid = useAuthUserId(auth);
  const profileAligned = isUserProfileAlignedWithSession(user, sessionUid);
  const seenIdsRef = React.useRef<Set<string>>(new Set());
  const initializedRef = React.useRef(false);
  const deadlinesRanRef = React.useRef(false);
  const officeTasksDeadlinesRanRef = React.useRef(false);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !profileAligned || !sessionUid) return null;
    return collection(firestore, `users/${sessionUid}/notifications`);
  }, [firestore, profileAligned, sessionUid]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  React.useEffect(() => {
    if (!user || !profileAligned) return;
    if (!canUseBrowserNotifications()) return;
    void (async () => {
      const perm = await requestBrowserNotificationPermission();
      if (perm === "granted" && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()) {
        await registerDeviceFcmToken();
      }
    })();
  }, [user, profileAligned]);

  React.useEffect(() => {
    if (!notifications) return;

    if (!initializedRef.current) {
      notifications.forEach((n) => seenIdsRef.current.add(n.id));
      initializedRef.current = true;
      return;
    }

    const fresh = notifications.filter(
      (n) => !seenIdsRef.current.has(n.id) && !n.isRead,
    );
    for (const n of fresh) {
      seenIdsRef.current.add(n.id);
      void showBrowserNotificationForAppAlert(n);
    }
  }, [notifications]);

  React.useEffect(() => {
    if (!firestore || !user || !profileAligned || !sessionUid) return;
    if (!isClientePortalRole(user.role) && user.role !== "representative") return;
    const limits = getPackageLimits(user);
    if (!limits.allowsDeadlineAlerts) return;
    if (deadlinesRanRef.current) return;
    deadlinesRanRef.current = true;

    void (async () => {
      try {
        let empreendedorIds: string[] = [];
        if (user.role === "representative") {
          empreendedorIds = await fetchEmpreendedorIdsForRepresentative(firestore, user);
        } else {
          const snap = await getDocs(
            query(
              collection(firestore, "empreendedores"),
              where("userId", "==", sessionUid),
            ),
          );
          empreendedorIds = snap.docs.map((d) => d.id);
        }
        empreendedorIds = empreendedorIds.filter((id) => id && !id.includes("invalid"));
        await runClientPortalDeadlineAlerts(firestore, empreendedorIds, {
          excludeUserId: sessionUid,
        });
      } catch (e) {
        console.warn("[NotificationPushProvider] prazos:", e);
      }
    })();
  }, [firestore, user, profileAligned, sessionUid]);

  React.useEffect(() => {
    if (!firestore || !user || !profileAligned || !sessionUid) return;
    if (!canAccessOfficeTasks(user.role)) return;
    if (officeTasksDeadlinesRanRef.current) return;
    officeTasksDeadlinesRanRef.current = true;

    void (async () => {
      try {
        await runOfficeTaskDeadlineAlerts(firestore, sessionUid, {
          excludeUserId: sessionUid,
        });
      } catch (e) {
        console.warn("[NotificationPushProvider] tarefas:", e);
      }
    })();
  }, [firestore, user, profileAligned, sessionUid]);

  return null;
}
