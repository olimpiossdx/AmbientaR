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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_AI_LOCAL_SOURCE_PATH } from "@/lib/ai-local-source-defaults";

const AI_LOCAL_SOURCE_PATH_KEY = "ai_lab_local_source_path_v1";
const AI_LOCAL_SOURCE_EXTENSIONS_KEY = "ai_lab_local_source_extensions_v1";
const AI_LOCAL_SOURCE_INCREMENTAL_KEY = "ai_lab_local_source_incremental_v1";
const AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY =
  "ai_lab_local_source_modified_after_v1";
const DEFAULT_EXTENSIONS = ".pdf,.doc,.docx,.txt,.md,.csv";

export function AiLocalSourcePanel({ className }: { className?: string }) {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const [path, setPath] = React.useState(DEFAULT_AI_LOCAL_SOURCE_PATH);
  const [extensions, setExtensions] = React.useState(DEFAULT_EXTENSIONS);
  const [modifiedAfter, setModifiedAfter] = React.useState("");
  const [incrementalOnly, setIncrementalOnly] = React.useState(true);
  const [isTesting, setIsTesting] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(AI_LOCAL_SOURCE_PATH_KEY);
    const savedExtensions = window.localStorage.getItem(
      AI_LOCAL_SOURCE_EXTENSIONS_KEY,
    );
    const savedModifiedAfter = window.localStorage.getItem(
      AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY,
    );
    const savedIncremental = window.localStorage.getItem(
      AI_LOCAL_SOURCE_INCREMENTAL_KEY,
    );
    if (saved?.trim()) setPath(saved.trim());
    if (savedExtensions?.trim()) setExtensions(savedExtensions.trim());
    if (savedModifiedAfter) setModifiedAfter(savedModifiedAfter);
    if (savedIncremental) setIncrementalOnly(savedIncremental === "true");
  }, []);

  const savePath = () => {
    if (!path.trim()) {
      toast({
        variant: "destructive",
        title: "Caminho inválido",
        description: "Informe uma pasta válida.",
      });
      return;
    }
    window.localStorage.setItem(AI_LOCAL_SOURCE_PATH_KEY, path.trim());
    window.localStorage.setItem(
      AI_LOCAL_SOURCE_EXTENSIONS_KEY,
      extensions.trim() || DEFAULT_EXTENSIONS,
    );
    window.localStorage.setItem(
      AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY,
      modifiedAfter,
    );
    window.localStorage.setItem(
      AI_LOCAL_SOURCE_INCREMENTAL_KEY,
      String(incrementalOnly),
    );
    toast({
      title: "Pasta salva",
      description: "A base local da IA foi atualizada.",
    });
  };

  const testImport = async () => {
    if (!path.trim()) return;
    setIsTesting(true);
    try {
      const res = await fetch("/api/ai-lab/import-reference-files", {
        method: "POST",
        headers: await getAdminApiRequestHeaders(auth),
        body: JSON.stringify({
          basePath: path.trim(),
          extensions: extensions
            .split(",")
            .map((ext) => ext.trim())
            .filter(Boolean),
          modifiedAfter: modifiedAfter || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Falha ao validar pasta.");
      toast({
        title: "Pasta validada",
        description: `Encontrados ${data.totalFound ?? 0}, elegíveis ${data.totalEligible ?? 0}, importáveis ${data.totalImported ?? 0}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na validação",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível acessar esta pasta.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Pasta base IA (local)
            <Badge variant="secondary">Legado / dev</Badge>
          </CardTitle>
          <CardDescription>
            Import local no servidor de desenvolvimento. Preferir Biblioteca OneDrive
            em produção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Caminho da pasta</Label>
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder={
                DEFAULT_AI_LOCAL_SOURCE_PATH || "C:\\caminho\\para\\Termos de Referencia"
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Extensões permitidas (separadas por vírgula)</Label>
            <Input
              value={extensions}
              onChange={(e) => setExtensions(e.target.value)}
              placeholder={DEFAULT_EXTENSIONS}
            />
          </div>
          <div className="space-y-1">
            <Label>Modificados após (opcional)</Label>
            <Input
              type="datetime-local"
              value={modifiedAfter}
              onChange={(e) => setModifiedAfter(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={incrementalOnly}
              onChange={(e) => setIncrementalOnly(e.target.checked)}
            />
            Reindexação incremental automática
          </label>
          <div className="flex gap-2">
            <Button type="button" onClick={savePath}>
              Salvar caminho
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void testImport()}
              disabled={isTesting}
            >
              {isTesting ? "Validando..." : "Validar pasta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
