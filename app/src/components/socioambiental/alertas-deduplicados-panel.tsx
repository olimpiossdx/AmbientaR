"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AlertaExtratoUnificado } from "@/lib/types/analise-socioambiental";
import {
  criterioBadgeClassName,
  criterioBadgeVariant,
} from "@/lib/socioambiental/criterio-resultado-display";

type AlertasDeduplicadosPanelProps = {
  alertas: AlertaExtratoUnificado[];
};

export function AlertasDeduplicadosPanel({ alertas }: AlertasDeduplicadosPanelProps) {
  if (!alertas.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas consolidados</CardTitle>
          <CardDescription>
            Extrato completo — nenhum alerta ou restrição após deduplicação.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alertas consolidados</CardTitle>
        <CardDescription>
          Visão única por tipo de risco e código de alerta (imóvel + glebas).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.map((a) => (
          <div
            key={`${a.tipoRisco}::${a.codigoAlerta}`}
            className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{a.tipoRisco}</p>
              <p className="text-xs text-muted-foreground">
                {a.geometrias.join(" · ")}
              </p>
              <p className="text-xs text-muted-foreground">{a.detalhe}</p>
            </div>
            <Badge
              variant={criterioBadgeVariant(a.resultado)}
              className={criterioBadgeClassName(a.resultado)}
            >
              {a.resultado}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
