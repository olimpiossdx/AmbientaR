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
    isPdfImagesLoading,
    isBrandingReady,
    brandingMissingSlots,
    refetch,
  } = useLocalBranding();

  if (isPdfImagesLoading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Preparando exportações</AlertTitle>
        <AlertDescription>
          Carregando cabeçalho, rodapé e marca d&apos;água para PDF e Word…
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasBrandingUrls) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Exportação bloqueada</AlertTitle>
        <AlertDescription>
          Envie as três imagens abaixo. Sem elas, relatórios e documentos oficiais não
          podem ser exportados ({BRANDING_SETUP_PATH}).
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
      <AlertTitle>Imagens não carregaram</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          URLs configuradas, mas o sistema não conseguiu ler:{' '}
          <strong>{brandingMissingSlots.join(', ') || 'uma ou mais imagens'}</strong>.
          Exportações PDF/Word ficam bloqueadas até resolver.
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Confirme que os ficheiros abrem na pré-visualização acima.</li>
          <li>Recarregue a página (F5) ou clique em &quot;Recarregar imagens&quot;.</li>
          <li>
            Em desenvolvimento local, configure{' '}
            <code className="text-xs">GOOGLE_APPLICATION_CREDENTIALS</code> se o erro
            persistir.
          </li>
        </ul>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar imagens
        </Button>
      </AlertDescription>
    </Alert>
  );
}
