"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";
import { queryRagChunks } from "@/lib/rag";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";

type SearchMode = "all" | "cloud" | "juridica";

type UnifiedHit = {
  id: string;
  source: "cloud" | "juridica";
  title: string;
  path?: string;
  excerpt: string;
  score?: number;
};

export function McpRagSearchTester() {
  const { auth, firestore } = useFirebase();
  const [mode, setMode] = React.useState<SearchMode>("all");
  const [query, setQuery] = React.useState("");
  const [pathPrefix, setPathPrefix] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [hits, setHits] = React.useState<UnifiedHit[]>([]);
  const [meta, setMeta] = React.useState<string | null>(null);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setMeta(null);
    setHits([]);
    const collected: UnifiedHit[] = [];
    const notes: string[] = [];

    try {
      if (mode === "all" || mode === "cloud") {
        try {
          const headers = await getAdminApiRequestHeaders(auth);
          const res = await fetch("/api/cloud-rag/search", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
              query: q,
              pathPrefix: pathPrefix.trim() || undefined,
              maxChunks: 12,
            }),
          });
          const data = await parseApiJsonResponse<{
            success?: boolean;
            error?: string;
            chunks?: Array<{
              fileName: string;
              path: string;
              chunkText: string;
              score?: number;
            }>;
          }>(res);
          if (!res.ok || !data.success) {
            notes.push(`OneDrive: ${data.error || "indisponível"}`);
          } else if (Array.isArray(data.chunks)) {
            for (const c of data.chunks) {
              collected.push({
                id: `cloud:${c.path}`,
                source: "cloud",
                title: c.fileName,
                path: c.path,
                excerpt: c.chunkText,
                score: Number(c.score || 0),
              });
            }
          }
        } catch (e) {
          notes.push(
            `OneDrive: ${e instanceof Error ? e.message : "falha na pesquisa"}`,
          );
        }
      }

      if (mode === "all" || mode === "juridica") {
        if (!firestore) {
          notes.push("Base Jurídica: Firestore indisponível.");
        } else {
          try {
            const chunks = await queryRagChunks(firestore, { maxChunks: 80 });
            const qLower = q.toLowerCase();
            const matched = chunks
              .filter((c) => c.chunkText.toLowerCase().includes(qLower))
              .slice(0, 12);
            for (const c of matched) {
              const title = [c.titulo, c.numero].filter(Boolean).join(" — ") || "Trecho normativo";
              collected.push({
                id: `jur:${title}:${c.chunkText.slice(0, 40)}`,
                source: "juridica",
                title,
                excerpt: c.chunkText,
              });
            }
            if (matched.length === 0 && chunks.length > 0) {
              notes.push(
                "Base Jurídica: nenhum trecho com o termo (busca textual simples, até 80 trechos recentes).",
              );
            }
          } catch (e) {
            notes.push(
              `Base Jurídica: ${e instanceof Error ? e.message : "falha na consulta"}`,
            );
          }
        }
      }

      collected.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setHits(collected);
      setMeta(
        [
          `${collected.length} resultado(s)`,
          notes.length ? notes.join(" · ") : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Teste de busca unificado
        </CardTitle>
        <CardDescription>
          Pesquisa na biblioteca OneDrive (cloud-rag) e na Base Jurídica (rag_index).
          Resultados com fonte identificada para auditoria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Origem</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as SearchMode)}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="mode-all" />
              <Label htmlFor="mode-all" className="font-normal">
                Todas
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="cloud" id="mode-cloud" />
              <Label htmlFor="mode-cloud" className="font-normal">
                OneDrive
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="juridica" id="mode-jur" />
              <Label htmlFor="mode-jur" className="font-normal">
                Base Jurídica
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mcp-rag-q">Consulta</Label>
          <Input
            id="mcp-rag-q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="termo, norma, CPF/CNPJ, assunto..."
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
          />
        </div>

        {(mode === "all" || mode === "cloud") && (
          <div className="space-y-2">
            <Label htmlFor="mcp-rag-prefix">Prefixo OneDrive (opcional)</Label>
            <Input
              id="mcp-rag-prefix"
              value={pathPrefix}
              onChange={(e) => setPathPrefix(e.target.value)}
              placeholder="Pimenta Ltda/CLIENTES/..."
            />
          </div>
        )}

        <Button type="button" disabled={busy || !query.trim()} onClick={() => void runSearch()}>
          {busy ? "Pesquisando..." : "Pesquisar"}
        </Button>

        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}

        {hits.length > 0 && (
          <ul className="max-h-[28rem] space-y-3 overflow-auto rounded-md border p-3 text-sm">
            {hits.map((hit) => (
              <li key={hit.id} className="border-b pb-3 last:border-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={hit.source === "cloud" ? "default" : "secondary"}>
                    {hit.source === "cloud" ? "OneDrive" : "Base Jurídica"}
                  </Badge>
                  <span className="font-medium">{hit.title}</span>
                  {hit.score != null && hit.score > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      score {hit.score.toFixed(3)}
                    </span>
                  ) : null}
                </div>
                {hit.path ? (
                  <p className="truncate text-xs text-muted-foreground">{hit.path}</p>
                ) : null}
                <Textarea
                  readOnly
                  className="mt-2 h-20 text-xs"
                  value={hit.excerpt.slice(0, 900)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
