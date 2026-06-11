"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImovelLocalizadorPanel } from "@/components/geospatial/imovel-localizador-panel";
import { CarHistoricoPanel } from "@/components/geospatial/car-historico-panel";
import { useFirebase } from "@/firebase";
import { fetchCarSnapshotHistory } from "@/lib/geospatial/car-snapshot-store";
import {
  compareCarSnapshotHistory,
  type CarHistoricoAvaliacao,
} from "@/lib/geospatial/car-snapshot-compare";
import type { CarSnapshotRecord } from "@/lib/geospatial/car-snapshot-store";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import { History, Loader2, Search } from "lucide-react";

function formatDt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function HistoricoCarPage() {
  const { firestore } = useFirebase();
  const [carQuery, setCarQuery] = React.useState("");
  const [activeCar, setActiveCar] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [records, setRecords] = React.useState<(CarSnapshotRecord & { id: string })[]>(
    [],
  );
  const [avaliacao, setAvaliacao] = React.useState<CarHistoricoAvaliacao | null>(
    null,
  );

  const loadHistory = React.useCallback(
    async (cod: string) => {
      const trimmed = cod.trim();
      if (!trimmed || !firestore) return;
      setLoading(true);
      setActiveCar(trimmed);
      try {
        const list = await fetchCarSnapshotHistory(firestore, trimmed, 25);
        setRecords(list);
        setAvaliacao(compareCarSnapshotHistory(list, trimmed));
      } catch {
        setRecords([]);
        setAvaliacao(null);
      } finally {
        setLoading(false);
      }
    },
    [firestore],
  );

  const handleLocalizacaoConfirmed = React.useCallback(
    (resolved: LocalizacaoResolvida) => {
      const cod =
        resolved.imovelSelecionadoCod ?? resolved.imoveis[0]?.codImovel ?? "";
      if (cod) {
        setCarQuery(cod);
        void loadHistory(cod);
      }
    },
    [loadHistory],
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Histórico CAR (SICAR)" />
      <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Versões registradas pelo AmbientaR
            </CardTitle>
            <CardDescription>
              O WFS público do SICAR não expõe retificações anteriores. Cada execução
              de pacote ou confirmação com geometria grava um snapshot para comparar
              omissões na retificação.{" "}
              <Link href="/studies/analise-socioambiental" className="text-primary underline">
                Pacote socioambiental
              </Link>
              {" · "}
              <Link href="/analise-ambiental" className="text-primary underline">
                Análise geoespacial
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 max-w-3xl">
              <div className="grid gap-2 flex-1 min-w-[240px]">
                <Label htmlFor="car-hist">Número do CAR</Label>
                <Input
                  id="car-hist"
                  placeholder="MG-3170404-… ou GO-…"
                  value={carQuery}
                  onChange={(e) => setCarQuery(e.target.value)}
                />
              </div>
              <Button
                type="button"
                className="self-end gap-2"
                disabled={loading || carQuery.trim().length < 8}
                onClick={() => void loadHistory(carQuery)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Consultar histórico
              </Button>
            </div>

            <ImovelLocalizadorPanel
              initialCarCod={carQuery}
              extratoMgObrigatorioParaConfirmar={false}
              showCarHistorico={false}
              panelTitle="Localizar imóvel (opcional)"
              panelDescription="Confirme um CAR para abrir o histórico automaticamente."
              onConfirmed={handleLocalizacaoConfirmed}
            />

            {activeCar ? (
              <CarHistoricoPanel codImovel={activeCar} avaliacao={avaliacao} />
            ) : null}

            {activeCar && records.length > 0 ? (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Área (ha)</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Riscos Wave A</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDt(r.capturedAtUtc)}
                        </TableCell>
                        <TableCell>{r.areaHa.toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{r.source}</TableCell>
                        <TableCell className="text-xs">{r.metodoEntrada}</TableCell>
                        <TableCell>
                          {r.riscoCamadas?.length ? (
                            <Badge variant="secondary">{r.riscoCamadas.length} camada(s)</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : activeCar && !loading ? (
              <p className="text-sm text-muted-foreground">
                Nenhum snapshot para este CAR. Execute um pacote socioambiental ou confirme
                o imóvel num trâmite para criar a primeira versão.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
