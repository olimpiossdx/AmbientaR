"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import { listFadWorkspaces, listMosaics, type FadMosaicDto } from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";

export function FadBibliotecaClient() {
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [mosaics, setMosaics] = React.useState<FadMosaicDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok) {
          setWorkspaces(res.data);
          if (res.data[0]) setWorkspaceId(res.data[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getFadAuthToken();
        const res = await listMosaics(token, workspaceId);
        if (res.ok) setMosaics(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId]);

  if (loading && workspaces.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Biblioteca satelital</h1>
          <p className="text-sm text-muted-foreground">Imagens já montadas para o imóvel.</p>
        </div>
        <div className="space-y-1">
          <Label>Imóvel</Label>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mosaics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma imagem no acervo.{" "}
          <Link href={`${FAD_ROUTE_BASE}/montar-acervo`} className="text-primary underline">
            Montar acervo
          </Link>
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mosaics.map((m) => (
            <li key={m.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{m.requestedDate}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {m.previewUrl ? (
                    <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={m.previewUrl}
                        alt={`Satélite ${m.requestedDate}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {m.attribution}
                    {m.resolutionM ? ` · ~${m.resolutionM} m` : ""}
                  </p>
                  <Link
                    href={`${FAD_ROUTE_BASE}/montar-acervo?workspace=${workspaceId}`}
                    className="text-sm text-primary underline"
                  >
                    Abrir no mapa
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
