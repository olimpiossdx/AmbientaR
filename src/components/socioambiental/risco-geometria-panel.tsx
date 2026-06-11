"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RiscoPorGeometria } from "@/lib/types/analise-socioambiental";
import {
  criterioBadgeClassName,
  criterioBadgeVariant,
} from "@/lib/socioambiental/criterio-resultado-display";

type RiscoGeometriaPanelProps = {
  geometrias: RiscoPorGeometria[];
};

export function RiscoGeometriaPanel({ geometrias }: RiscoGeometriaPanelProps) {
  if (!geometrias.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Risco por geometria</CardTitle>
        <CardDescription>
          Sobreposição, proximidade (m) e buffer — padrão Extrato Risco
          Socioambiental.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {geometrias.map((g) => (
          <div key={g.id} className="space-y-2">
            <p className="text-sm font-semibold">
              {g.rotulo}{" "}
              <span className="font-normal text-muted-foreground">
                ({g.areaHa.toFixed(2)} ha)
              </span>
            </p>
            {g.linhas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum risco espacial identificado.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-2 font-medium">Tipo de risco</th>
                      <th className="p-2 font-medium text-right">Sobrep. ha</th>
                      <th className="p-2 font-medium text-right">%</th>
                      <th className="p-2 font-medium text-right">Prox. m</th>
                      <th className="p-2 font-medium text-center">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.linhas.map((l) => (
                      <tr key={`${g.id}-${l.layerId}`} className="border-b">
                        <td className="p-2">{l.tipoRisco}</td>
                        <td className="p-2 text-right tabular-nums">
                          {l.sobreposicaoHa > 0.01
                            ? l.sobreposicaoHa.toFixed(2)
                            : "0"}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {l.sobreposicaoPct > 0.01
                            ? l.sobreposicaoPct.toFixed(2)
                            : "0"}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {l.proximidadeM ?? "—"}
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={criterioBadgeVariant(l.resultado)}
                            className={criterioBadgeClassName(l.resultado)}
                          >
                            {l.resultado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
