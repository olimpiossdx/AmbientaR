"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import type { AccessRequest } from "@/lib/types";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import {
  collectRequestedDocumentDigits,
  createAccessRequestsForDelegate,
  filterAccessRequestsForDelegate,
} from "@/lib/delegate-access-requests";

export type ApprovedTitularEntry = {
  name: string;
  cpfCnpj: string;
  type: "cliente" | "empreendedor";
};

type DelegateAccessPortfolioCardProps = {
  role: "representative" | "consultor_representante";
  accessRequests: AccessRequest[] | null | undefined;
  approvedTitulares: ApprovedTitularEntry[];
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  showCarteiraLink?: boolean;
};

function statusBadge(status: AccessRequest["status"]) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="shrink-0">
          Aguardando aprovação
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="secondary" className="shrink-0">
          Aprovado
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="shrink-0">
          Recusado
        </Badge>
      );
    default:
      return null;
  }
}

function sortRequests(requests: AccessRequest[]): AccessRequest[] {
  const order = { pending: 0, approved: 1, rejected: 2 };
  return [...requests].sort((a, b) => {
    const sa = order[a.status] ?? 3;
    const sb = order[b.status] ?? 3;
    if (sa !== sb) return sa - sb;
    const ta = String(a.createdAt ?? "");
    const tb = String(b.createdAt ?? "");
    return tb.localeCompare(ta);
  });
}

export function DelegateAccessPortfolioCard({
  role,
  accessRequests,
  approvedTitulares,
  requesterUserId,
  requesterName,
  requesterEmail,
  showCarteiraLink = role === "consultor_representante",
}: DelegateAccessPortfolioCardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const myRequests = useMemo(
    () => sortRequests(filterAccessRequestsForDelegate(accessRequests, role)),
    [accessRequests, role],
  );

  const pendingRequests = myRequests.filter((r) => r.status === "pending");
  const rejectedRequests = myRequests.filter((r) => r.status === "rejected");

  const titularNameByCpf = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of approvedTitulares) {
      const key = normalizeDocumentDigits(t.cpfCnpj || "");
      if (key.length >= 11) map.set(key, t.name);
    }
    return map;
  }, [approvedTitulares]);

  const approvedFromRequests = useMemo(() => {
    const seen = new Set(
      approvedTitulares.map((t) => normalizeDocumentDigits(t.cpfCnpj || "")),
    );
    return myRequests.filter((r) => {
      if (r.status !== "approved") return false;
      const key = normalizeDocumentDigits(r.cpfOfInterested);
      return key.length >= 11 && !seen.has(key);
    });
  }, [myRequests, approvedTitulares]);

  const handleRequestAccess = async () => {
    const digits = normalizeDocumentDigits(newDocument);
    if (digits.length !== 11 && digits.length !== 14) {
      toast({
        variant: "destructive",
        title: "Documento inválido",
        description: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.",
      });
      return;
    }
    const existing = collectRequestedDocumentDigits(myRequests);
    if (existing.has(digits)) {
      toast({
        variant: "destructive",
        title: "Pedido já existente",
        description:
          "Já existe um pedido pendente ou aprovado para este CPF/CNPJ.",
      });
      return;
    }
    if (!firestore) return;
    setSubmitting(true);
    try {
      const { created, titularNotified } = await createAccessRequestsForDelegate(firestore, {
        requesterUserId,
        email: requesterEmail,
        name: requesterName,
        role,
        documents: [digits],
        existingDigits: existing,
      });
      if (created > 0) {
        toast({
          title: "Pedido enviado",
          description: titularNotified
            ? "O titular receberá o pedido em Cadastro → Usuários e poderá aprovar ou recusar."
            : "Pedido registrado, mas nenhum titular com este CPF/CNPJ foi encontrado para notificar. Confirme o documento ou peça ao titular que complete o cadastro.",
          variant: titularNotified ? "default" : "destructive",
        });
        setNewDocument("");
        setDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Não foi possível enviar",
          description: "Tente novamente ou verifique sua conexão.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    role === "consultor_representante"
      ? "Minha carteira de clientes"
      : "Clientes (titulares) e pedidos de acesso";

  const description =
    role === "consultor_representante" ? (
      <>
        Pedidos feitos no cadastro e novas solicitações aparecem abaixo. O
        titular aprova ou recusa em Cadastro → Usuários. Após aprovação,
        gerencie em <strong>Minha Carteira</strong> no menu.
      </>
    ) : (
      <>
        Informe o CPF/CNPJ de cada titular cujos dados deseja acessar. O titular
        aprova ou recusa em Cadastro → Usuários.
      </>
    );

  return (
    <>
      <Card id="delegate-access-portfolio">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Solicitar mais acesso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingRequests.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                Pedidos aguardando aprovação
              </h4>
              <p className="text-xs text-muted-foreground">
                Inclui o CPF/CNPJ informado no cadastro inicial, se ainda não
                foi aprovado.
              </p>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-2 rounded-md border px-3 py-2 bg-amber-500/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatCpfCnpjDisplay(req.cpfOfInterested)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Enviado no cadastro ou por você · aguardando o titular
                      </p>
                    </div>
                    {statusBadge(req.status)}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              Acesso aprovado pelo titular
            </h4>
            {approvedTitulares.length > 0 || approvedFromRequests.length > 0 ? (
              <div className="space-y-2">
                {approvedTitulares.map((t, i) => (
                  <div
                    key={`${t.cpfCnpj}-${i}`}
                    className="flex flex-col gap-2 rounded-md border px-3 py-2 bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCpfCnpjDisplay(t.cpfCnpj)} ·{" "}
                        {t.type === "cliente" ? "Cliente" : "Empreendedor"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge("approved")}
                      {showCarteiraLink && (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/carteira">Minha Carteira</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {approvedFromRequests.map((req) => {
                  const key = normalizeDocumentDigits(req.cpfOfInterested);
                  const name =
                    titularNameByCpf.get(key) ||
                    "Titular (nome após sincronizar cadastro)";
                  return (
                    <div
                      key={req.id}
                      className="flex flex-col gap-2 rounded-md border px-3 py-2 bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCpfCnpjDisplay(req.cpfOfInterested)}
                        </p>
                      </div>
                      {statusBadge("approved")}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-1">
                Nenhum titular aprovou seu acesso ainda. Use &quot;Solicitar mais
                acesso&quot; para pedir acesso a outro CPF/CNPJ de empreendimento.
              </p>
            )}
          </section>

          {rejectedRequests.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                Pedidos recusados pelo titular
              </h4>
              <div className="space-y-2">
                {rejectedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-2 rounded-md border border-destructive/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="text-sm font-medium">
                      {formatCpfCnpjDisplay(req.cpfOfInterested)}
                    </p>
                    {statusBadge(req.status)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingRequests.length === 0 &&
            approvedTitulares.length === 0 &&
            approvedFromRequests.length === 0 &&
            rejectedRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum pedido registrado. Informe o CPF/CNPJ do titular no
                cadastro ou clique em &quot;Solicitar mais acesso&quot;.
              </p>
            )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar acesso a outro titular</DialogTitle>
            <DialogDescription>
              Informe o CPF ou CNPJ do titular ou empreendimento cujos dados você
              precisa operar. O empreendedor (titular) poderá aprovar ou recusar
              em Cadastro → Usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delegate-access-doc">CPF ou CNPJ do titular</Label>
            <MaskedInput
              id="delegate-access-doc"
              mask="cpfCnpj"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={newDocument}
              onChange={(val) => setNewDocument(val)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleRequestAccess()}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
