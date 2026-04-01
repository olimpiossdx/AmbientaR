'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trees, Smartphone } from 'lucide-react';

export default function AppCampoPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="App de campo (offline)" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Coleta de campo offline
            </CardTitle>
            <CardDescription>
              Fase 5 do AmbientaR 2.0 – aplicativo para inventário florestal, fauna, fotos e coordenadas em área rural, com sincronização quando houver conexão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escopo inicial, modelo de dados e opções de sincronização (React Native + WatermelonDB ou PWA) estão descritos em <strong>docs/APP-OFFLINE-FASE5.md</strong>.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trees className="h-4 w-4" />
              <span>Fluxo prioritário previsto: inventário florestal + fotos + coordenadas.</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
