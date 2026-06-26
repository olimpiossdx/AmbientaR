"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Loader2 } from "lucide-react";
import { useFirebase, useAuth } from "@/firebase";
import type { PlatformSubscriptionAcceptanceRecord } from "@/lib/platform-subscription-contract/types";

type Props = {
  acceptanceId?: string | null;
  userLabel?: string;
  compact?: boolean;
};

export function PlatformSubscriptionAcceptanceViewer({
  acceptanceId,
  userLabel,
  compact,
}: Props) {
  const { auth } = useFirebase();
  const { user: sessionUser } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [acceptance, setAcceptance] =
    React.useState<PlatformSubscriptionAcceptanceRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!acceptanceId || !auth?.currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/platform-subscription-contract/${acceptanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar.");
      setAcceptance(data.acceptance as PlatformSubscriptionAcceptanceRecord);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [acceptanceId, auth]);

  if (!acceptanceId) return null;

  const isAdmin = sessionUser?.role === "admin";
  const signed = acceptance?.signedAt
    ? new Date(acceptance.signedAt).toLocaleString("pt-BR")
    : null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={compact ? "ghost" : "outline"}
              size={compact ? "icon" : "sm"}
              className={compact ? "h-8 w-8" : "h-8 gap-1 text-xs"}
              disabled={loading}
              onClick={() => void load()}
              aria-label="Ver contrato de plataforma assinado"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {!compact && <span>Contrato plataforma</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            Cópia datada do aceite no cadastro
            {userLabel ? ` — ${userLabel}` : ""}. Somente administrador pode
            alterar ou apagar o registro.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {error ? (
        <span className="text-xs text-destructive ml-1">{error}</span>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Contrato de plataforma (cópia assinada)</DialogTitle>
            <DialogDescription>
              {signed ? `Assinado em ${signed}` : ""}
              {acceptance?.recordKind === "gratuito_legacy"
                ? " · Plano gratuito (regras atuais)"
                : " · Assinatura anual"}
              {isAdmin ? " · Você pode apagar apenas como administrador." : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto rounded border bg-muted/30 p-2">
            {acceptance?.contractHtml ? (
              <iframe
                title="Contrato plataforma"
                className="w-full min-h-[60vh] bg-white rounded"
                sandbox=""
                srcDoc={acceptance.contractHtml}
              />
            ) : (
              <p className="text-sm text-muted-foreground p-4">Sem conteúdo.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
