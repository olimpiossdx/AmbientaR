"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  isSubscriptionLapsed,
  resolveStoredPackage,
} from "@/lib/package-subscription";
import { PACKAGE_LIMITS } from "@/lib/package-limits";
import type { AppUser } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

type Props = {
  user: AppUser;
};

export function SubscriptionExpiredBanner({ user }: Props) {
  if (!isSubscriptionLapsed(user)) return null;

  const stored = resolveStoredPackage(user);
  const storedLabel = PACKAGE_LIMITS[stored]?.tierLabel ?? stored;
  const freeLabel = PACKAGE_LIMITS.gratuito.tierLabel;

  return (
    <Alert
      variant="destructive"
      className="mx-4 mt-4 mb-0 border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
    >
      <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      <AlertTitle>Assinatura expirada — modo gratuito ativo</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          O período do plano <strong>{storedLabel}</strong> terminou. Seu perfil
          voltou aos limites do plano <strong>{freeLabel}</strong>: 1
          empreendimento, 1 registro por módulo, sem upload e sem alertas
          automáticos. Funções extras do plano pago ficam bloqueadas até a
          renovação.
        </p>
        <p>
          A versão gratuita pode exibir <strong>publicidade de terceiros</strong>{" "}
          (Google AdSense) em áreas periféricas do aplicativo, conforme contrato.
        </p>
        <Button size="sm" variant="outline" className="mt-1" asChild>
          <Link href="/users">Renovar ou alterar plano</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
