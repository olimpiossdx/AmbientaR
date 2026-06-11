"use client";



import * as React from "react";

import Link from "next/link";

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useFirebase } from "@/firebase";

import { useMcpRagHubOverview } from "@/components/mcp-rag/use-mcp-rag-hub-overview";

import { BookText, Cloud, CloudUpload, Database, DollarSign } from "lucide-react";

import { mcpRagTabQuery } from "@/components/mcp-rag/mcp-rag-tabs";



export function McpRagStatusOverview() {

  const { auth } = useFirebase();

  const { loading, overview, error, refresh } = useMcpRagHubOverview(auth);



  if (loading) {

    return (

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {[1, 2, 3].map((i) => (

          <Skeleton key={i} className="h-40 w-full rounded-lg" />

        ))}

      </div>

    );

  }



  const juridica = overview?.juridica;

  const cloudRag = overview?.cloudRag;

  const onedrive = overview?.onedrive;

  const costs = overview?.costs;

  const officialCount = overview?.officialSources?.length ?? 0;

  const enabledOfficial =

    overview?.officialSources?.filter((s) => s.enabled).length ?? 0;



  return (

    <div className="space-y-4">

      {error ? (

        <p className="text-sm text-destructive">{error}</p>

      ) : null}

      <div className="flex flex-wrap gap-2">

        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>

          Atualizar status

        </Button>

      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-base">

              <BookText className="h-4 w-4" />

              Base Jurídica

            </CardTitle>

            <CardDescription>Firestore · knowledge_sources + rag_index</CardDescription>

          </CardHeader>

          <CardContent className="space-y-2 text-sm">

            <p>

              Fontes: <strong>{juridica?.sources ?? "—"}</strong> · Trechos:{" "}

              <strong>{juridica?.chunks ?? "—"}</strong>

            </p>

            <Button asChild variant="link" className="h-auto p-0">

              <Link href={mcpRagTabQuery("fontes")}>Gerir fontes</Link>

            </Button>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-base">

              <Cloud className="h-4 w-4" />

              Biblioteca OneDrive

            </CardTitle>

            <CardDescription>cloud_rag_* · indexação RAG</CardDescription>

          </CardHeader>

          <CardContent className="space-y-2 text-sm">

            <div className="flex flex-wrap gap-1">

              <Badge variant={cloudRag?.enabled ? "default" : "secondary"}>

                RAG {cloudRag?.enabled ? "ativo" : "off"}

              </Badge>

              <Badge variant={cloudRag?.graphOk ? "default" : "destructive"}>

                Graph {cloudRag?.graphOk ? "ok" : "erro"}

              </Badge>

            </div>

            <p>

              Ficheiros: <strong>{cloudRag?.files ?? 0}</strong> · Chunks:{" "}

              <strong>{cloudRag?.chunks ?? 0}</strong>

              {cloudRag?.pendingIndex ? (

                <> · Pendentes: <strong>{cloudRag.pendingIndex}</strong></>

              ) : null}

            </p>

            <Button asChild variant="link" className="h-auto p-0">

              <Link href={mcpRagTabQuery("biblioteca")}>Sync e indexação</Link>

            </Button>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-base">

              <CloudUpload className="h-4 w-4" />

              OneDrive clientes

            </CardTitle>

            <CardDescription>Vínculos de pastas · autofill</CardDescription>

          </CardHeader>

          <CardContent className="space-y-2 text-sm">

            <div className="flex flex-wrap gap-1">

              <Badge variant={onedrive?.enabled ? "default" : "secondary"}>

                Sync {onedrive?.enabled ? "ativo" : "off"}

              </Badge>

              <Badge variant={onedrive?.graphOk ? "default" : "destructive"}>

                Token {onedrive?.graphOk ? "ok" : "erro"}

              </Badge>

            </div>

            {onedrive?.lastSyncAt ? (

              <p className="text-xs text-muted-foreground">

                Último sync: {new Date(onedrive.lastSyncAt).toLocaleString("pt-BR")}

              </p>

            ) : (

              <p className="text-xs text-muted-foreground">Nenhum sync registado.</p>

            )}

            <Button asChild variant="link" className="h-auto p-0">

              <Link href={mcpRagTabQuery("onedrive")}>Integração</Link>

            </Button>

          </CardContent>

        </Card>

      </div>



      <div className="grid gap-4 md:grid-cols-2">

        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-base">

              <Database className="h-4 w-4" />

              Fontes oficiais

            </CardTitle>

            <CardDescription>ALMG, SEMAD, DO MG…</CardDescription>

          </CardHeader>

          <CardContent className="space-y-2 text-sm">

            <p>

              Registadas: <strong>{officialCount}</strong> · Ativas:{" "}

              <strong>{enabledOfficial}</strong>

            </p>

            <div className="flex flex-wrap gap-2">

              <Button asChild variant="link" className="h-auto p-0">

                <Link href={mcpRagTabQuery("oficiais")}>Gerir fontes</Link>

              </Button>

              <Button asChild variant="link" className="h-auto p-0">

                <Link href={mcpRagTabQuery("ingestoes")}>Ingestões</Link>

              </Button>

            </div>

          </CardContent>

        </Card>



        <Card>

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-base">

              <DollarSign className="h-4 w-4" />

              Custos (estimativa)

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-2 text-sm">

            <p>

              Total acumulado:{" "}

              <strong>

                {new Intl.NumberFormat("pt-BR", {

                  style: "currency",

                  currency: "USD",

                  minimumFractionDigits: 4,

                }).format(costs?.totalEstimateUsd ?? 0)}

              </strong>

            </p>

            <Button asChild variant="link" className="h-auto p-0">

              <Link href={mcpRagTabQuery("custos")}>Detalhar custos</Link>

            </Button>

            <Button asChild variant="link" className="h-auto p-0 ml-0 block">

              <Link href={mcpRagTabQuery("logs")}>Logs de execução</Link>

            </Button>

          </CardContent>

        </Card>

      </div>

    </div>

  );

}

