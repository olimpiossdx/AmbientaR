"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import type { Client, Condicionante, Empreendedor, License, WaterPermit } from "@/lib/types";
import { isConsultorRepresentante } from "@/lib/role-guards";

export default function CarteiraClientDossierPage() {
  const params = useParams();
  const clientId = decodeURIComponent(String(params?.clientId ?? ""));
  const { user } = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [empreendedores, setEmpreendedores] = useState<Empreendedor[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [outorgas, setOutorgas] = useState<WaterPermit[]>([]);
  const [condicionantes, setCondicionantes] = useState<Condicionante[]>([]);

  useEffect(() => {
    if (!firestore || !user || !clientId) return;
    const consultorUid = resolvePortalAuthUid(user);
    if (!isConsultorRepresentante(user.role) || !consultorUid) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const clientSnap = await getDoc(doc(firestore, "clients", clientId));
        let clientData: Client | null = null;
        if (clientSnap.exists()) {
          clientData = { id: clientSnap.id, ...clientSnap.data() } as Client;
          if (!clientData.approvedConsultorIds?.includes(consultorUid)) {
            setClient(null);
            return;
          }
          setClient(clientData);
        }

        const empSnap = await getDocs(
          query(
            collection(firestore, "empreendedores"),
            where("approvedConsultorIds", "array-contains", consultorUid),
          ),
        );
        const emps = empSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Empreendedor)
          .filter(
            (e) =>
              e.sourceClientId === clientId ||
              e.cpfCnpj === clientData?.cpfCnpj ||
              e.id === clientId,
          );
        setEmpreendedores(emps);
        const empIds = emps.map((e) => e.id).slice(0, 10);
        if (empIds.length === 0) return;

        const [licSnap, outSnap] = await Promise.all([
          getDocs(
            query(
              collection(firestore, "licenses"),
              where("empreendedorId", "in", empIds),
            ),
          ),
          getDocs(
            query(
              collection(firestore, "outorgas"),
              where("empreendedorId", "in", empIds),
            ),
          ),
        ]);
        setLicenses(licSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as License));
        setOutorgas(outSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as WaterPermit));

        const refIds = [
          ...licSnap.docs.map((d) => d.id),
          ...outSnap.docs.map((d) => d.id),
        ].slice(0, 10);
        if (refIds.length > 0) {
          const condSnap = await getDocs(
            query(
              collection(firestore, "condicionantes"),
              where("referenceId", "in", refIds),
            ),
          );
          setCondicionantes(
            condSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Condicionante),
          );
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [firestore, user, clientId]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={client?.name ?? "Dossiê do cliente"}
        description={client?.cpfCnpj}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/carteira">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à carteira
          </Link>
        </Button>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : !client && empreendedores.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Cliente não encontrado ou sem vínculo aprovado com sua carteira.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Empreendedores</CardTitle>
                <CardDescription>{empreendedores.length} cadastro(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {empreendedores.map((e) => (
                  <div key={e.id} className="rounded border px-3 py-2 text-sm">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-muted-foreground">{e.cpfCnpj}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Licenças</CardTitle>
                <CardDescription>{licenses.length} registro(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {licenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma licença.</p>
                ) : (
                  licenses.map((l) => (
                    <div key={l.id} className="rounded border px-3 py-2 text-sm">
                      <p className="font-medium">{l.licenseNumber || l.id}</p>
                      <p className="text-muted-foreground">{l.status}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outorgas</CardTitle>
                <CardDescription>{outorgas.length} registro(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {outorgas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma outorga.</p>
                ) : (
                  outorgas.map((o) => (
                    <div key={o.id} className="rounded border px-3 py-2 text-sm">
                      <p className="font-medium">{o.permitNumber || o.processNumber || o.id}</p>
                      <p className="text-muted-foreground">{o.status}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Condicionantes em aberto</CardTitle>
                <CardDescription>{condicionantes.length} registro(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {condicionantes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma condicionante listada.
                  </p>
                ) : (
                  condicionantes.map((c) => (
                    <div key={c.id} className="rounded border px-3 py-2 text-sm">
                      <p className="font-medium">{c.description?.slice(0, 120)}</p>
                      <p className="text-muted-foreground">{c.status}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
