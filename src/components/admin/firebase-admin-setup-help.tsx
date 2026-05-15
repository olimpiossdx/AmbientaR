"use client";

import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  FIREBASE_AUTH_USERS_CONSOLE_URL,
  FIREBASE_SERVICE_ACCOUNTS_CONSOLE_URL,
  WINDOWS_SERVICE_ACCOUNT_PATH,
} from "@/lib/admin/firebase-admin-setup";

type FirebaseAdminSetupHelpProps = {
  variant?: "banner" | "inline";
  emailHint?: string;
};

function SetupSteps() {
  return (
    <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm">
      <li>
        Firebase Console → Definições do projeto →{" "}
        <a
          href={FIREBASE_SERVICE_ACCOUNTS_CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2"
        >
          Contas de serviço
        </a>{" "}
        → Gerar nova chave privada (JSON).
      </li>
      <li>
        Guarde o ficheiro em{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          {WINDOWS_SERVICE_ACCOUNT_PATH}
        </code>{" "}
        (ver também <code className="text-xs">config/README.md</code>).
      </li>
      <li>
        Em <code className="text-xs">E:\A\.env.local</code>, adicione:{" "}
        <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">
          GOOGLE_APPLICATION_CREDENTIALS={WINDOWS_SERVICE_ACCOUNT_PATH}
        </code>
      </li>
      <li>
        Pare o servidor (<kbd className="text-xs">Ctrl+C</kbd>) e execute de novo{" "}
        <code className="text-xs">npm run dev</code>.
      </li>
    </ol>
  );
}

function ConsoleAuthButton() {
  return (
    <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
      <a
        href={FIREBASE_AUTH_USERS_CONSOLE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Abrir Authentication no Firebase Console
      </a>
    </Button>
  );
}

export function FirebaseAdminSetupHelp({
  variant = "banner",
  emailHint,
}: FirebaseAdminSetupHelpProps) {
  if (variant === "inline") {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Opção A (rápida):</strong> apague o
          utilizador em Authentication no Firebase Console.
          {emailHint ? (
            <>
              {" "}
              Procure por{" "}
              <strong className="text-foreground">{emailHint}</strong>.
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <ConsoleAuthButton />
        </div>
        <p className="font-medium text-foreground">
          Opção B — credenciais no PC (uso frequente):
        </p>
        <SetupSteps />
      </div>
    );
  }

  return (
    <Alert
      variant="destructive"
      className="border-amber-600/40 bg-amber-500/10 text-foreground"
    >
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Servidor sem credenciais do Firebase Admin
      </AlertTitle>
      <AlertDescription className="text-foreground/90">
        <p>
          O botão &quot;Liberar e-mail&quot; precisa da conta de serviço no{" "}
          <code className="text-xs">.env.local</code> ou do ficheiro em{" "}
          <code className="text-xs">config/</code>. Enquanto isso, use o Console
          ou configure abaixo.
        </p>
        <p className="mt-2 font-medium">Opção A — sem configurar o servidor:</p>
        <p className="mt-1 text-sm">
          Apague o e-mail em Authentication no Firebase Console.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ConsoleAuthButton />
        </div>
        <p className="mt-4 font-medium">Opção B — neste PC (3 passos + reiniciar):</p>
        <SetupSteps />
      </AlertDescription>
    </Alert>
  );
}
