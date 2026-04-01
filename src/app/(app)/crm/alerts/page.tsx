"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import {
  useAuth,
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  useFirebase,
} from "@/firebase";
import { collection, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";

const CRM_ROLES = ["admin", "sales", "supervisor", "financial"] as const;

export default function CrmAlertsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useAuth();
  const { auth } = useFirebase();
  const { toast } = useToast();

  // Sempre usa o UID da sessão quando disponível para respeitar as regras
  // `/users/{userId}/notifications` com `request.auth.uid == userId`.
  const userId = auth?.currentUser?.uid || user?.uid || null;

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (!userId) return null;
    return collection(firestore, `users/${userId}/notifications`);
  }, [firestore, user, userId]);

  const { data: notifications, isLoading } =
    useCollection<Notification>(notificationsQuery);

  const sorted = React.useMemo(() => {
    const list = notifications ?? [];
    return [...list].sort((a, b) => {
      const ta =
        a.createdAt?.toDate?.()?.getTime?.() ??
        new Date(a.createdAt ?? 0).getTime();
      const tb =
        b.createdAt?.toDate?.()?.getTime?.() ??
        new Date(b.createdAt ?? 0).getTime();
      return (tb || 0) - (ta || 0);
    });
  }, [notifications]);

  const unreadCount = React.useMemo(
    () => (sorted ?? []).filter((n) => !n.isRead).length,
    [sorted],
  );

  const markAsRead = async (n: Notification) => {
    if (!firestore || !user || !userId) return;
    const ref = doc(firestore, `users/${userId}/notifications`, n.id);
    try {
      await updateDoc(ref, { isRead: true });
    } catch {
      const permissionError = new FirestorePermissionError({
        path: ref.path,
        operation: "update",
        requestResourceData: { isRead: true },
      });
      errorEmitter.emit("permission-error", permissionError);
    }
  };

  const markAllAsRead = async () => {
    if (!firestore || !user || !userId) return;
    const unread = sorted.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      unread.forEach((n) => {
        const ref = doc(firestore, `users/${userId}/notifications`, n.id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
      toast({
        title: "Tudo certo",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch {
      toast({
        title: "Falha",
        description: "Não foi possível marcar todas como lidas.",
        variant: "destructive" as any,
      });
    }
  };

  const handleOpen = async (n: Notification) => {
    if (!n.isRead) await markAsRead(n);
    if (n.link) router.push(n.link);
  };

  if (!user || !CRM_ROLES.includes(user.role as any)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Alertas & Notificações (CRM)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Você não tem permissão para visualizar os alertas do CRM.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Alertas & Notificações (CRM)">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              unreadCount > 0
                ? "bg-blue-500/15 text-blue-700 border-blue-500/30"
                : "",
            )}
          >
            {unreadCount} não lida(s)
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar tudo como lido
          </Button>
        </div>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Central de notificações
            </CardTitle>
            <CardDescription>
              Alertas do seu usuário (subcoleção{" "}
              <span className="font-mono">
                users/&lt;userId&gt;/notifications
              </span>
              ).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            )}
            {!isLoading && sorted.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma notificação encontrada.
              </div>
            )}
            {!isLoading &&
              sorted.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpen(n)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/40",
                    n.isRead
                      ? "opacity-80"
                      : "border-blue-500/30 bg-blue-500/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{n.title}</span>
                        {!n.isRead ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/15 text-blue-700 border-blue-500/30"
                          >
                            Novo
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {n.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {n.createdAt?.toDate?.()?.toLocaleString?.("pt-BR") ??
                          (n.createdAt
                            ? new Date(n.createdAt).toLocaleString("pt-BR")
                            : "—")}
                        {n.actorRole ? ` • ${n.actorRole}` : ""}
                      </div>
                    </div>
                    {n.link ? (
                      <div className="shrink-0 text-muted-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
