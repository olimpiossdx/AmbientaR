"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const IDE_SISEMA_NET_VIEWER_URL =
  "https://visualizador.idesisema.meioambiente.mg.gov.br/";

export default function IdeSisemanetPage() {
  const [iframeError, setIframeError] = React.useState(false);
  const [iframeLoading, setIframeLoading] = React.useState(true);
  const [iframeKey, setIframeKey] = React.useState(0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="IDE-SisemaNet"
        description="Geovisualizador oficial do Sisema-MG para consulta de camadas e imóveis."
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
        <Card className="flex min-h-[min(70vh,560px)] flex-1 flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>Geovisualizador IDE-SisemaNet</CardTitle>
            <CardDescription>
              Explore mapas, localize imóveis pelo CAR e consulte informações
              públicas do meio ambiente em Minas Gerais. O conteúdo abaixo é
              carregado diretamente do portal do governo.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex min-h-[420px] flex-1 flex-col p-0">
            {iframeError ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <p className="mb-2 text-sm font-medium text-destructive">
                  Não foi possível carregar o Geovisualizador.
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Se o serviço estiver fora do ar, tente novamente em instantes
                  ou acesse o site oficial do Sisema.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIframeError(false);
                    setIframeLoading(true);
                    setIframeKey((k) => k + 1);
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="relative min-h-[420px] flex-1 w-full">
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Carregando Geovisualizador...</p>
                    </div>
                  </div>
                )}
                <iframe
                  key={iframeKey}
                  src={IDE_SISEMA_NET_VIEWER_URL}
                  className="h-full min-h-[420px] w-full max-w-full rounded-b-lg border-0"
                  title="IDE-SisemaNet Geovisualizador"
                  onLoad={() => {
                    setIframeLoading(false);
                    setIframeError(false);
                  }}
                  onError={() => {
                    setIframeLoading(false);
                    setIframeError(true);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
