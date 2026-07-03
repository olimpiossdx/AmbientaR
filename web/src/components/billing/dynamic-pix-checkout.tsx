"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { parseUnifiedApiResponse } from "@/lib/api-response";

export type DynamicPixChargeData = {
  txid: string;
  amountBrl: number;
  pixCopiaECola: string;
  expiresAt?: string | null;
  mock?: boolean;
  packageLabel?: string;
};

type Props = {
  charge: DynamicPixChargeData;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onPaid?: () => void;
  onCancel?: () => void;
};

function qrImageUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`;
}

export function DynamicPixCheckout({
  charge,
  getAuthHeaders,
  onPaid,
  onCancel,
}: Props) {
  const { toast } = useToast();
  const [polling, setPolling] = React.useState(false);
  const [paid, setPaid] = React.useState(false);

  const pollStatus = React.useCallback(async () => {
    setPolling(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/billing/charge-status?txid=${encodeURIComponent(charge.txid)}`,
        { headers },
      );
      const parsed = await parseUnifiedApiResponse<{
        paid: boolean;
        platformPaymentStatus?: string;
      }>(res);
      if (parsed.ok && parsed.data.paid) {
        setPaid(true);
        toast({
          title: "Pagamento confirmado",
          description: "Seu acesso à plataforma foi liberado.",
        });
        onPaid?.();
      }
    } catch {
      // silencioso no polling
    } finally {
      setPolling(false);
    }
  }, [charge.txid, getAuthHeaders, onPaid, toast]);

  React.useEffect(() => {
    if (paid) return;
    const id = window.setInterval(() => {
      void pollStatus();
    }, 5000);
    void pollStatus();
    return () => window.clearInterval(id);
  }, [paid, pollStatus]);

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(charge.pixCopiaECola);
      toast({ title: "Copiado", description: "Código PIX copiado." });
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Copie manualmente o código exibido.",
      });
    }
  };

  if (paid) {
    return (
      <Card className="border-emerald-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
            Pagamento confirmado
          </CardTitle>
          <CardDescription>
            Você já pode usar a plataforma com o plano contratado.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          PIX — pagamento do plano
        </CardTitle>
        <CardDescription>
          Escaneie o QR ou copie o código. O valor é{" "}
          <strong>fixo para este pedido</strong> — após o pagamento, a liberação
          é automática.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-primary">
            R$ {charge.amountBrl.toFixed(2).replace(".", ",")}
          </span>
          {charge.packageLabel ? (
            <Badge variant="secondary">{charge.packageLabel}</Badge>
          ) : null}
          {charge.mock ? (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              Modo simulação (Sicoob mock)
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <img
            src={qrImageUrl(charge.pixCopiaECola)}
            alt="QR Code PIX"
            width={240}
            height={240}
            className="rounded-lg border bg-white p-2"
          />
          <div className="flex-1 space-y-2 w-full">
            <p className="text-xs text-muted-foreground">Copia e cola</p>
            <div className="max-h-28 overflow-y-auto rounded bg-muted p-2 font-mono text-[11px] break-all">
              {charge.pixCopiaECola}
            </div>
            <Button type="button" variant="secondary" onClick={copyPix} className="w-full sm:w-auto">
              <Copy className="mr-2 h-4 w-4" />
              Copiar código PIX
            </Button>
            {charge.expiresAt ? (
              <p className="text-xs text-muted-foreground">
                Validade do QR:{" "}
                {new Date(charge.expiresAt).toLocaleString("pt-BR")}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              ID da cobrança: <code>{charge.txid}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {polling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Aguardando confirmação do pagamento…
        </div>

        {charge.mock ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                const headers = await getAuthHeaders();
                const res = await fetch("/api/billing/mock-confirm", {
                  method: "POST",
                  headers: { ...headers, "Content-Type": "application/json" },
                  body: JSON.stringify({ txid: charge.txid }),
                });
                const parsed = await parseUnifiedApiResponse(res);
                if (!parsed.ok) throw new Error(parsed.message);
                await pollStatus();
              } catch (e) {
                toast({
                  variant: "destructive",
                  title: "Simulação falhou",
                  description: e instanceof Error ? e.message : "Erro",
                });
              }
            }}
          >
            Simular pagamento (somente mock/dev)
          </Button>
        ) : null}

        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Continuar depois
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
