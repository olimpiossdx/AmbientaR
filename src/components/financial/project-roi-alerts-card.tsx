'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { ProjectRoiAlertItem } from '@/lib/project-roi-alerts';
import { formatCurrencyBRL } from '@/lib/financial-core';
import { ProjectRoiSemaforoBadge } from '@/components/financial/project-roi-semaforo-badge';

export function ProjectRoiAlertsCard({
  alerts,
  loading,
}: {
  alerts: ProjectRoiAlertItem[];
  loading?: boolean;
}) {
  if (loading) return null;

  return (
    <Card className={alerts.length ? 'border-destructive/40' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle
            className={`h-4 w-4 ${alerts.length ? 'text-destructive' : 'text-muted-foreground'}`}
          />
          Projetos em atenção (ROI)
        </CardTitle>
        <CardDescription>
          Casos com prejuízo gerencial ou gasto alto com recebimento baixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum caso ativo em situação crítica.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <li
                key={a.caseId}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border-b pb-2 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <ProjectRoiSemaforoBadge semaforo={a.semaforo} />
                  <span className="font-medium truncate">{a.title}</span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatCurrencyBRL(a.resultado)}
                  {a.margemPct != null ? ` · ${a.margemPct.toFixed(0)}%` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href="/financial/projetos-roi">Ver Projetos & ROI</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
