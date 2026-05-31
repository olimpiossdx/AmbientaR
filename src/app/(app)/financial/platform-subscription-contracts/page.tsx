"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlatformSubscriptionAcceptanceViewer } from "@/components/platform-subscription-contract/acceptance-viewer";
import type { PlatformSubscriptionLedgerRecord } from "@/lib/platform-subscription-contract/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformSubscriptionContractsPage() {
  const { firestore, user } = useFirebase();

  const ledgerQuery = useMemoFirebase(() => {
    if (!firestore || user?.role !== "admin" && user?.role !== "financial") {
      return null;
    }
    return query(
      collection(firestore, "platform_subscription_ledger"),
      orderBy("signedAt", "desc"),
      limit(100),
    );
  }, [firestore, user?.role]);

  const { data: rows, isLoading } =
    useCollection<PlatformSubscriptionLedgerRecord>(ledgerQuery);

  if (user?.role !== "admin" && user?.role !== "financial") {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Acesso restrito ao financeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Contratos de plataforma"
        description="Cópias dos aceites de cadastro (titular/autônomo) para caixa, receita e justificativa bancária. Rotina separada dos contratos comerciais de consultoria."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data assinatura</TableHead>
              <TableHead>Contratante</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor anual</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Cópia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : !rows?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-sm">
                  Nenhum registro ainda. Gerado automaticamente no cadastro de titulares.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {row.signedAt
                      ? new Date(row.signedAt).toLocaleString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{row.contratanteNome}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.contratanteCpfCnpj} · {row.contratanteEmail}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.packageId}</TableCell>
                  <TableCell className="text-sm">
                    {row.annualAmountBrl != null
                      ? `R$ ${row.annualAmountBrl.toFixed(2).replace(".", ",")}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.billingMode === "monthly_12x"
                      ? `12× R$ ${(row.installmentAmountBrl ?? 0).toFixed(0)}`
                      : row.billingMode === "annual_upfront"
                        ? "À vista"
                        : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <PlatformSubscriptionAcceptanceViewer
                      acceptanceId={row.acceptanceId}
                      compact
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
