"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  writeCookieConsent,
  readCookieConsent,
  type CookieConsentRecord,
} from "@/lib/cookie-consent";
import { Cookie } from "lucide-react";

type Props = {
  onConsentChange?: (record: CookieConsentRecord) => void;
};

export function CookieConsentBanner({ onConsentChange }: Props) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(!readCookieConsent());
  }, []);

  if (!visible) return null;

  const persist = (choice: "accepted" | "essential_only") => {
    const record = writeCookieConsent(choice);
    setVisible(false);
    onConsentChange?.(record);
  };

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-amber-500/30 bg-background/95 p-4 shadow-lg backdrop-blur md:bottom-4 md:left-4 md:right-auto md:max-w-lg md:rounded-lg md:border"
    >
      <div className="mx-auto flex max-w-4xl gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm leading-snug text-foreground">
            No plano gratuito, utilizamos cookies e tecnologias correlatas para
            exibir <strong>publicidade de terceiros</strong> (Google AdSense),
            medir desempenho e oferecer comunicações comerciais, conforme o
            contrato e a{" "}
            <Link
              href="/politica-privacidade"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => persist("accepted")}>
              Aceitar cookies e publicidade
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => persist("essential_only")}
            >
              Apenas essenciais
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cookies essenciais mantêm login e preferências. Publicidade só é
            carregada se você aceitar. Planos pagos não exibem anúncios de
            terceiros.
          </p>
        </div>
      </div>
    </div>
  );
}
