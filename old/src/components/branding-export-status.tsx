'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { BRANDING_SETUP_PATH } from '@/lib/branding/requirements';

/** Estado da pré-carga de imagens para exportação PDF/Word. */
export function BrandingExportStatus() {
  const {
    hasBrandingUrls,
    isFirestoreLoading,
    isFetchingPdfImages,
    isBrandingReady,
    brandingMissingSlots,
    refetch,
    syncFromServer,
  } = useLocalBranding();

  if (isFirestoreLoading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Carregando configuração</AlertTitle>
        <AlertDescription>
          A ler identidade visual da consultoria…
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasBrandingUrls) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Exportação bloqueada</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Envie as três imagens abaixo. Sem elas, relatórios e documentos oficiais não
            podem ser exportados ({BRANDING_SETUP_PATH}).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void syncFromServer()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar do servidor
          </Button>
          <p className="text-xs text-muted-foreground">
            No telemóvel, se já configurou noutro aparelho, use este botão ou limpe os dados
            do site no Firefox antes de recarregar.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (isFetchingPdfImages && !isBrandingReady) {
    return (
      <Alert className="border-blue-500/30 bg-blue-500/5">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertTitle className="flex items-center gap-2">
          Imagens configuradas
          <Badge variant="outline" className="text-blue-700 border-blue-500/40">
            A preparar PDF
          </Badge>
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Cabeçalho, rodapé e marca d&apos;água estão guardados. A preparar pré-visualização
            para exportação (em redes móveis pode demorar até ~30 s).
          </p>
          <p className="text-xs text-muted-foreground">
            Pode enviar ou substituir imagens abaixo enquanto isso. Se ficar preso, use
            &quot;Recarregar imagens&quot;.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (isBrandingReady) {
    return (
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="flex items-center gap-2">
          Pronto para exportar
          <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
            PDF + Word
          </Badge>
        </AlertTitle>
        <AlertDescription>
          As três imagens foram carregadas. Contratos, estudos, ofícios e relatórios
          usarão esta identidade visual ao exportar.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Imagens não carregaram para exportação</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          URLs configuradas, mas o sistema não conseguiu ler:{' '}
          <strong>{brandingMissingSlots.join(', ') || 'uma ou mais imagens'}</strong>.
          Exportações PDF/Word ficam bloqueadas até resolver.
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Confirme que os ficheiros abrem na pré-visualização acima.</li>
          <li>Recarregue a página ou clique em &quot;Recarregar imagens&quot;.</li>
          <li>
            No Firefox no telemóvel: desative bloqueio de rastreamento para{' '}
            <strong>ambientar.ia.br</strong> ou limpe dados do site.
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar imagens
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void syncFromServer()}
          >
            Atualizar do servidor
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
