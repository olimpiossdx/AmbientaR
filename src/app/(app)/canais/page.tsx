'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Share2, Landmark } from 'lucide-react';

export default function CanaisPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Canais e Integrações" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Integração com WhatsApp, Instagram e cobrança recorrente (Vindi). Os fluxos estão em planejamento e configuração.
          Detalhes em <code className="text-sm bg-muted px-1">docs/CANAIS-FASE6.md</code> (Fase 6).
        </p>
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl">
          <Card id="whatsapp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                WhatsApp
              </CardTitle>
              <CardDescription>
                Consulta criada → laudo pronto → envio automático via WhatsApp Business (n8n).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fluxo mínimo definido na documentação. Payloads e endpoints para n8n a serem configurados.
              </p>
              <span className="text-sm text-muted-foreground mt-2 block">Ver detalhes em <code className="text-xs">docs/CANAIS-FASE6.md</code>.</span>
            </CardContent>
          </Card>
          <Card id="instagram">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Instagram
              </CardTitle>
              <CardDescription>
                Story com CTA → direct → criação de lead ou consulta simplificada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Captação de leads e conversão em consulta. Fluxo desenhado na documentação.
              </p>
              <span className="text-sm text-muted-foreground mt-2 block">Ver detalhes em <code className="text-xs">docs/CANAIS-FASE6.md</code>.</span>
            </CardContent>
          </Card>
          <Card id="assinaturas">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Assinaturas (Vindi)
              </CardTitle>
              <CardDescription>
                Planos Gratuito, Premium e Enterprise. Cobrança recorrente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Limites por plano (consultas, usuários, armazenamento). Integração Vindi a configurar.
              </p>
              <span className="text-sm text-muted-foreground mt-2 block">Ver detalhes em <code className="text-xs">docs/CANAIS-FASE6.md</code>.</span>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
