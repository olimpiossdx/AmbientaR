"use client";

import * as React from "react";
import { Leaf, LogOut, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import type { AppUser } from "@/lib/types";

type Props = { user: AppUser };

export function PlatformAccessBlocked({ user }: Props) {
  const { logout } = useFirebase();

  const pending = user.platformPaymentStatus === "pending_verification";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 flex items-center gap-2 text-primary">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
          <Leaf className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold">AmbientaR</span>
      </div>

      <Card className="w-full max-w-md border-amber-500/30 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle>Pagamento em análise</CardTitle>
          <CardDescription className="text-left space-y-2 pt-2">
            {pending ? (
              <>
                <p>
                  Sua assinatura anual da plataforma está{" "}
                  <strong>aguardando confirmação do pagamento</strong>. Após a
                  equipe validar o PIX ou o cartão, o acesso será liberado
                  automaticamente e a publicidade de terceiros será removida.
                </p>
                <p className="text-sm">
                  Se já pagou, aguarde a confirmação. Em caso de dúvida, envie o
                  comprovante pelo e-mail abaixo.
                </p>
              </>
            ) : (
              <p>
                Não foi possível validar seu acesso à plataforma. Contacte o
                suporte.
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <a
              href={`mailto:${typeof process !== "undefined" && process.env.NEXT_PUBLIC_AMBIENTAR_SUPPORT_EMAIL ? process.env.NEXT_PUBLIC_AMBIENTAR_SUPPORT_EMAIL : "contato@pimentaconsultoria.com.br"}`}
            >
              <Mail className="h-4 w-4 shrink-0" />
              Falar com o suporte
            </a>
          </Button>
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
