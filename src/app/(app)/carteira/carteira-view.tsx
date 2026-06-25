"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, ChevronRight } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import { fetchEmpreendedorIdsForConsultor } from "@/lib/consultor-empreendedor-ids";
import { fetchActiveAssignmentsForConsultor } from "@/lib/consultor-assignments";
import type { Client, ConsultorAssignment, Empreendedor } from "@/lib/types";
import { isAdminRole, isClientePortalRole, isConsultorRepresentante } from "@/lib/role-guards";

type CarteiraEntry = {
  clientId: string;
  clientName: string;
  cpfCnpj: string;
  empreendedorCount: number;
  assignment?: ConsultorAssignment;
};

export function CarteiraView() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<CarteiraEntry[]>([]);
  const [titularConsultors, setTitularConsultors] = useState<
    { uid: string; name: string; email: string }[]
  >([]);

  const portalUid = resolvePortalAuthUid(user);

  useEffect(() => {
    if (!firestore || !user) return;

    const load = async () => {
      setLoading(true);
      try {
        if (isConsultorRepresentante(user.role)) {
          const consultorUid = resolvePortalAuthUid(user);
          if (!consultorUid) {
            setEntries([]);
            return;
          }
          const [empIds, assignments] = await Promise.all([
            fetchEmpreendedorIdsForConsultor(firestore, user),
            fetchActiveAssignmentsForConsultor(firestore, consultorUid),
          ]);
          const validEmpIds = empIds.filter((id) => id !== "invalid-placeholder");
          if (validEmpIds.length === 0) {
            setEntries([]);
            return;
          }
          const clientsSnap = await getDocs(
            query(
              collection(firestore, "clients"),
              where("approvedConsultorIds", "array-contains", consultorUid),
            ),
          );
          const empreendedoresSnap = await getDocs(
            query(
              collection(firestore, "empreendedores"),
              where("approvedConsultorIds", "array-contains", consultorUid),
            ),
          );
          const byClient = new Map<string, CarteiraEntry>();
          clientsSnap.docs.forEach((d) => {
            const c = { id: d.id, ...d.data() } as Client;
            byClient.set(c.id, {
              clientId: c.id,
              clientName: c.name,
              cpfCnpj: c.cpfCnpj,
              empreendedorCount: 0,
              assignment: assignments.find((a) => a.clientId === c.id),
            });
          });
          empreendedoresSnap.docs.forEach((d) => {
            const e = { id: d.id, ...d.data() } as Empreendedor;
            const key = e.sourceClientId || e.cpfCnpj || e.id;
            const existing = byClient.get(key);
            if (existing) {
              existing.empreendedorCount += 1;
            } else {
              byClient.set(key, {
                clientId: key,
                clientName: e.name,
                cpfCnpj: e.cpfCnpj || "",
                empreendedorCount: 1,
                assignment: assignments.find((a) =>
                  a.empreendedorIds?.includes(e.id),
                ),
              });
            }
          });
          setEntries(Array.from(byClient.values()));
          return;
        }

        if (isClientePortalRole(user.role) && portalUid) {
          const clientsSnap = await getDocs(
            query(collection(firestore, "clients"), where("userId", "==", portalUid)),
          );
          const consultorUids = new Set<string>();
          clientsSnap.docs.forEach((d) => {
            const data = d.data() as Client;
            data.approvedConsultorIds?.forEach((uid) => consultorUids.add(uid));
          });
          const empreendedoresSnap = await getDocs(
            query(
              collection(firestore, "empreendedores"),
              where("userId", "==", portalUid),
            ),
          );
          empreendedoresSnap.docs.forEach((d) => {
            const data = d.data() as Empreendedor;
            data.approvedConsultorIds?.forEach((uid) => consultorUids.add(uid));
          });
          const consultors: { uid: string; name: string; email: string }[] = [];
          for (const uid of consultorUids) {
            const usersSnap = await getDocs(
              query(collection(firestore, "users"), where("uid", "==", uid)),
            );
            usersSnap.forEach((docSnap) => {
              const u = docSnap.data();
              consultors.push({
                uid,
                name: String(u.name || "Consultor"),
                email: String(u.email || ""),
              });
            });
          }
          setTitularConsultors(consultors);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [firestore, user, portalUid]);

  const title = useMemo(() => {
    if (isConsultorRepresentante(user?.role)) return "Minha Carteira";
    if (isClientePortalRole(user?.role)) return "Consultores vinculados";
    if (isAdminRole(user?.role)) return "Carteira (admin)";
    return "Carteira";
  }, [user?.role]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title} />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : isConsultorRepresentante(user?.role) ? (
          entries.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Nenhum cliente na carteira
                </CardTitle>
                <CardDescription>
                  Solicite acesso ao titular informando o CPF/CNPJ dele no cadastro
                  ou em Configurações → Usuários. Após aprovação, os clientes
                  aparecem aqui.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.clientId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{entry.clientName}</CardTitle>
                        <CardDescription>{entry.cpfCnpj}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {entry.empreendedorCount} empreendedor(es)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      {entry.assignment?.handoffNotes
                        ? `Notas: ${entry.assignment.handoffNotes}`
                        : "Dossiê operacional consolidado"}
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/carteira/${encodeURIComponent(entry.clientId)}`}>
                        Abrir dossiê
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : isClientePortalRole(user?.role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Consultores-representantes aprovados</CardTitle>
              <CardDescription>
                Gerencie vínculos em Configurações → Usuários (aprovar, recusar ou
                revogar consultores).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {titularConsultors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum consultor vinculado. Consultores externos só acessam seus
                  dados após sua aprovação explícita.
                </p>
              ) : (
                titularConsultors.map((c) => (
                  <div
                    key={c.uid}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <Badge>Consultor-Representante</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Use esta área como consultor-representante ou titular portal.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
