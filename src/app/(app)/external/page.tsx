"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

const IFRAME_LOAD_TIMEOUT_MS = 12_000;

function ExternalFallbackMessage({
  heading,
  body,
  hint,
  url,
  onOpen,
  onRetry,
}: {
  heading: string;
  body: string;
  hint?: string;
  url?: string | null;
  onOpen: () => void;
  onRetry?: () => void;
}) {
  return (
    <main className="flex min-w-0 flex-1 items-center justify-center overflow-auto p-4 md:p-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold">{heading}</h2>
        <p className="mt-2 text-muted-foreground">{body}</p>
        {hint ? (
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        ) : null}
        <ExternalFallbackActions
          url={url}
          onOpen={onOpen}
          onRetry={onRetry}
        />
      </div>
    </main>
  );
}

function ExternalFallbackActions({
  url,
  onOpen,
  onRetry,
}: {
  url?: string | null;
  onOpen: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Button type="button" onClick={onOpen} disabled={!url}>
        <ExternalLink className="mr-2 h-4 w-4" />
        Abrir em nova aba
      </Button>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

function ExternalPageShell({
  title,
  children,
  headerAction,
}: {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <PageHeader title={title}>{headerAction}</PageHeader>
      {children}
    </div>
  );
}

function ExternalPageContent() {
  const searchParams = useSearchParams();
  const url = searchParams?.get("url");
  const title = searchParams?.get("title");
  const openInNewTab = searchParams?.get("newTab") === "true";

  const [iframeLoading, setIframeLoading] = React.useState(true);
  const [iframeBlocked, setIframeBlocked] = React.useState(false);
  const [iframeKey, setIframeKey] = React.useState(0);

  const openExternal = React.useCallback(() => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [url]);

  const openInNewTabButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={openExternal}
      disabled={!url}
    >
      <ExternalLink className="mr-2 h-4 w-4" />
      Abrir em nova aba
    </Button>
  );

  React.useEffect(() => {
    if (openInNewTab && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [openInNewTab, url]);

  React.useEffect(() => {
    if (!url || openInNewTab) return;

    let cancelled = false;

    fetch(`/api/external-embed-check?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data: { embeddable?: boolean | null }) => {
        if (cancelled) return;
        if (data.embeddable === false) {
          setIframeBlocked(true);
          setIframeLoading(false);
        }
      })
      .catch(() => {
        /* desconhecido: tenta iframe */
      });

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setIframeLoading((stillLoading) => {
          if (stillLoading) {
            setIframeBlocked(true);
          }
          return false;
        });
      }
    }, IFRAME_LOAD_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [url, openInNewTab, iframeKey]);

  if (openInNewTab) {
    return (
      <ExternalPageShell title={title || "Link Externo"}>
        <ExternalFallbackMessage
          heading="Redirecionando..."
          body="Esta página foi aberta em uma nova aba para garantir a funcionalidade."
          hint="Se a nova aba não abriu, verifique se o navegador bloqueou o pop-up."
          url={url}
          onOpen={openExternal}
        />
      </ExternalPageShell>
    );
  }

  if (!url) {
    return (
      <ExternalPageShell title="Erro">
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
          <p>URL não fornecida.</p>
        </main>
      </ExternalPageShell>
    );
  }

  const pageTitle = title || "Link Externo";

  return (
    <ExternalPageShell title={pageTitle} headerAction={openInNewTabButton}>
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {iframeBlocked ? (
          <ExternalFallbackMessage
            heading="Não foi possível exibir aqui"
            body="Este site não permite ser aberto dentro do AmbientaR (restrição de segurança do provedor). Use o botão abaixo para acessar em uma nova aba."
            url={url}
            onOpen={openExternal}
            onRetry={() => {
              setIframeBlocked(false);
              setIframeLoading(true);
              setIframeKey((k) => k + 1);
            }}
          />
        ) : (
          <>
            {iframeLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Carregando conteúdo...</p>
                </div>
              </div>
            ) : null}
            <iframe
              key={iframeKey}
              src={url}
              className="h-[calc(100dvh-4rem)] min-h-[520px] w-full max-w-full border-0 md:h-full md:min-h-0"
              title={pageTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false);
                setIframeBlocked(true);
              }}
            />
          </>
        )}
      </main>
    </ExternalPageShell>
  );
}

export default function ExternalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-w-0 flex-col overflow-hidden">
          <PageHeader title="Carregando..." />
          <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
            <Skeleton className="h-full w-full" />
          </main>
        </div>
      }
    >
      <ExternalPageContent />
    </Suspense>
  );
}
