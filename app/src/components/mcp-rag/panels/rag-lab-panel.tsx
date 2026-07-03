"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { DEFAULT_AI_LOCAL_SOURCE_PATH } from "@/lib/ai-local-source-defaults";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";

type RagSource = {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  active?: boolean;
  updatedAt?: string;
};

const LOCAL_SOURCES_KEY = "ai_lab_sources_local_v1";
const AI_LOCAL_SOURCE_PATH_KEY = "ai_lab_local_source_path_v1";
const AI_LOCAL_SOURCE_EXTENSIONS_KEY = "ai_lab_local_source_extensions_v1";
const AI_LOCAL_SOURCE_INCREMENTAL_KEY = "ai_lab_local_source_incremental_v1";
const AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY =
  "ai_lab_local_source_modified_after_v1";
const AI_LOCAL_SOURCE_LAST_SYNC_AT_KEY = "ai_lab_local_source_last_sync_at_v1";
const DEFAULT_AI_LOCAL_SOURCE_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
];

function readLocalSources(): RagSource[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SOURCES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RagSource[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalSources(value: RagSource[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_SOURCES_KEY, JSON.stringify(value));
}

function isPermissionDenied(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error ? String((error as { code?: unknown }).code) : "";
  return code.includes("permission-denied");
}

export function RagLabPanel({ className }: { className?: string }) {
  const { user } = useAuth();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isImportingFiles, setIsImportingFiles] = React.useState(false);
  const [isCloudIndexing, setIsCloudIndexing] = React.useState(false);
  const [isImportingInternalDb, setIsImportingInternalDb] =
    React.useState(false);
  const [sources, setSources] = React.useState<RagSource[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const INTERNAL_COLLECTIONS = [
    "clients",
    "empreendedores",
    "projects",
    "licenses",
    "outorgas",
    "intervencoes",
    "condicionantes",
    "inspections",
  ] as const;

  React.useEffect(() => {
    const load = async () => {
      if (!firestore) {
        const list = readLocalSources()
          .sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""))
          .reverse();
        setSources(list);
        setIsLoading(false);
        return;
      }

      try {
        const snap = await getDocs(
          query(
            collection(firestore, "ai_lab_sources"),
            orderBy("updatedAt", "desc"),
          ),
        );
        const cloudSources = snap.docs.map((doc) => {
          const data = doc.data() as Omit<RagSource, "id">;
          return { id: doc.id, ...data };
        });
        setSources(cloudSources);
      } catch (error) {
        if (!isPermissionDenied(error)) {
          console.error("Erro ao carregar fontes RAG no Firestore:", error);
        }
        const list = readLocalSources()
          .sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""))
          .reverse();
        setSources(list);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [firestore]);

  const handleAddSource = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Informe título e conteúdo da fonte interna.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        active: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        sourceType: "internal",
      };

      if (firestore) {
        try {
          await addDoc(collection(firestore, "ai_lab_sources"), payload);
          const snap = await getDocs(
            query(
              collection(firestore, "ai_lab_sources"),
              orderBy("updatedAt", "desc"),
            ),
          );
          const cloudSources = snap.docs.map((doc) => {
            const data = doc.data() as Omit<RagSource, "id">;
            return { id: doc.id, ...data };
          });
          setSources(cloudSources);
        } catch (error) {
          if (!isPermissionDenied(error)) throw error;
          const next: RagSource = {
            id: `src_${Date.now()}`,
            ...payload,
            updatedAt: new Date().toISOString(),
          };
          const merged = [next, ...sources];
          setSources(merged);
          writeLocalSources(merged);
        }
      } else {
        const next: RagSource = {
          id: `src_${Date.now()}`,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        const merged = [next, ...sources];
        setSources(merged);
        writeLocalSources(merged);
      }
      setTitle("");
      setContent("");
      setTags("");
      toast({
        title: "Fonte adicionada",
        description: "Base interna atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar fonte RAG:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar a fonte.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const refreshCloudOrLocal = React.useCallback(async () => {
    if (!firestore) {
      const list = readLocalSources()
        .sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""))
        .reverse();
      setSources(list);
      return;
    }
    const snap = await getDocs(
      query(
        collection(firestore, "ai_lab_sources"),
        orderBy("updatedAt", "desc"),
      ),
    );
    setSources(
      snap.docs.map((d) => {
        const data = d.data() as Omit<RagSource, "id">;
        return { id: d.id, ...data };
      }),
    );
  }, [firestore]);

  const handleImportReferenceFolder = async () => {
    setIsImportingFiles(true);
    try {
      const configuredPath =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AI_LOCAL_SOURCE_PATH_KEY) ||
            DEFAULT_AI_LOCAL_SOURCE_PATH
          : DEFAULT_AI_LOCAL_SOURCE_PATH;
      const configuredExtensions =
        typeof window !== "undefined"
          ? (window.localStorage.getItem(AI_LOCAL_SOURCE_EXTENSIONS_KEY) || "")
              .split(",")
              .map((ext) => ext.trim())
              .filter(Boolean)
          : [];
      const configuredModifiedAfter =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY) ||
            ""
          : "";
      const incrementalOnly =
        typeof window !== "undefined"
          ? (window.localStorage.getItem(AI_LOCAL_SOURCE_INCREMENTAL_KEY) ||
              "true") === "true"
          : true;
      const lastSyncAt =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AI_LOCAL_SOURCE_LAST_SYNC_AT_KEY) || ""
          : "";
      const effectiveModifiedAfter = incrementalOnly
        ? lastSyncAt || configuredModifiedAfter
        : configuredModifiedAfter;

      const res = await fetch("/api/ai-lab/import-reference-files", {
        method: "POST",
        headers: await getAdminApiRequestHeaders(auth),
        body: JSON.stringify({
          basePath: configuredPath,
          extensions:
            configuredExtensions.length > 0
              ? configuredExtensions
              : DEFAULT_AI_LOCAL_SOURCE_EXTENSIONS,
          modifiedAfter: effectiveModifiedAfter || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Falha ao importar pasta de referência.");

      const imported = Array.isArray(data.imported) ? data.imported : [];
      if (imported.length === 0) {
        toast({
          title: "Importação concluída",
          description: "Nenhum arquivo elegível encontrado para indexação.",
        });
        return;
      }

      if (firestore) {
        for (const item of imported) {
          await addDoc(collection(firestore, "ai_lab_sources"), {
            title: item.title,
            content: item.content,
            tags: item.tags || ["termos-referencia"],
            active: true,
            sourceType: "internal_file",
            sourcePath: item.sourcePath || null,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
      } else {
        const existing = readLocalSources();
        const merged = [
          ...imported.map(
            (
              item: { title: string; content: string; tags?: string[] },
              idx: number,
            ) => ({
              id: `src_file_${Date.now()}_${idx}`,
              title: item.title,
              content: item.content,
              tags: item.tags || ["termos-referencia"],
              active: true,
              updatedAt: new Date().toISOString(),
            }),
          ),
          ...existing,
        ];
        writeLocalSources(merged);
      }

      await refreshCloudOrLocal();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          AI_LOCAL_SOURCE_LAST_SYNC_AT_KEY,
          new Date().toISOString(),
        );
      }
      toast({
        title: "Importação automática concluída",
        description: `${imported.length} arquivo(s) adicionados à base RAG com filtros e controle incremental.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description:
          error instanceof Error
            ? error.message
            : "Falha ao importar arquivos.",
      });
    } finally {
      setIsImportingFiles(false);
    }
  };

  const handleCloudLibrarySyncAndIndex = async () => {
    setIsCloudIndexing(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const syncRes = await fetch("/api/cloud-rag/sync", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const syncData = await parseApiJsonResponse<{
        success?: boolean;
        error?: string;
        itemsProcessed?: number;
      }>(syncRes);
      if (!syncRes.ok || !syncData.success) {
        throw new Error(syncData.error || "Falha ao sincronizar OneDrive.");
      }

      const indexRes = await fetch("/api/cloud-rag/index", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const indexData = await parseApiJsonResponse<{
        success?: boolean;
        error?: string;
        indexed?: number;
      }>(indexRes);
      if (!indexRes.ok || !indexData.success) {
        throw new Error(indexData.error || "Falha ao indexar OneDrive.");
      }

      toast({
        title: "Biblioteca OneDrive",
        description: `Sync: ${syncData.itemsProcessed ?? 0} itens. Indexação: ${indexData.indexed ?? 0} ficheiro(s). Pesquise em AI Lab → Biblioteca IA (OneDrive).`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na biblioteca nuvem",
        description:
          error instanceof Error ? error.message : "Falha inesperada.",
      });
    } finally {
      setIsCloudIndexing(false);
    }
  };

  const handleImportInternalDatabase = async () => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Firestore indisponível",
        description: "Conecte-se ao Firebase para importar bases internas.",
      });
      return;
    }
    setIsImportingInternalDb(true);
    try {
      const MAX_DOCS_PER_COLLECTION = 40;
      const importedPayloads: Array<{
        title: string;
        content: string;
        tags: string[];
      }> = [];

      for (const collectionName of INTERNAL_COLLECTIONS) {
        /** Limite na query evita ler coleções inteiras (custo Firestore por documento lido). */
        const snap = await getDocs(
          query(
            collection(firestore, collectionName),
            limit(MAX_DOCS_PER_COLLECTION),
          ),
        );
        const docs = snap.docs;
        docs.forEach((d) => {
          const raw = d.data();
          const content = JSON.stringify(raw).slice(0, 7000);
          importedPayloads.push({
            title: `${collectionName} :: ${d.id}`,
            content,
            tags: ["base-interna", collectionName],
          });
        });
      }

      for (const item of importedPayloads) {
        await addDoc(collection(firestore, "ai_lab_sources"), {
          title: item.title,
          content: item.content,
          tags: item.tags,
          active: true,
          sourceType: "internal_db",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      await refreshCloudOrLocal();
      toast({
        title: "Base interna importada",
        description: `${importedPayloads.length} fonte(s) indexadas com amostragem e limite por coleção.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao importar base interna",
        description:
          error instanceof Error ? error.message : "Falha inesperada.",
      });
    } finally {
      setIsImportingInternalDb(false);
    }
  };

  if (user && user.role !== "admin") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>
            Este módulo está disponível apenas para administradores nesta fase.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <CardTitle>Objetivo do módulo</CardTitle>
            <CardDescription>
              Estruturar a base de contexto para respostas de IA rastreáveis e
              úteis ao negócio.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              - Fontes: normas, modelos, processos internos e histórico
              operacional.
            </p>
            <p>
              - Pipeline: ingestão, chunking, embeddings, versionamento e
              expiração.
            </p>
            <p>
              - Governança: escopo por perfil, qualidade e observabilidade de
              respostas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cadastro de fonte interna</CardTitle>
            <CardDescription>
              Registre conteúdo interno para uso dos agentes e relatórios com
              base de dados própria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Procedimento interno de vistoria"
              />
            </div>
            <div className="space-y-1">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="licenças, financeiro, compliance"
              />
            </div>
            <div className="space-y-1">
              <Label>Conteúdo</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole aqui o texto que será indexado para consulta."
                className="min-h-36"
              />
            </div>
            <Button type="button" onClick={handleAddSource} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Adicionar fonte interna"}
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleImportReferenceFolder}
                disabled={isImportingFiles}
              >
                {isImportingFiles
                  ? "Importando pasta..."
                  : "Importar pasta local (legado)"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloudLibrarySyncAndIndex}
                disabled={isCloudIndexing}
              >
                {isCloudIndexing
                  ? "OneDrive..."
                  : "Sync + indexar OneDrive"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleImportInternalDatabase}
                disabled={isImportingInternalDb}
              >
                {isImportingInternalDb
                  ? "Importando base interna..."
                  : "Importar bases internas (Firestore)"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Preferência: biblioteca na nuvem (`ONEDRIVE_RAG_ENABLED`). Import
              local será descontinuado. Bancada completa em Biblioteca IA
              (OneDrive).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fontes internas cadastradas</CardTitle>
            <CardDescription>
              Estas fontes poderão ser selecionadas na geração de estudos e
              relatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && (
              <p className="text-sm text-muted-foreground">
                Carregando fontes...
              </p>
            )}
            {!isLoading && (!sources || sources.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nenhuma fonte interna cadastrada ainda.
              </p>
            )}
            {!isLoading &&
              sources.map((source) => (
                <div key={source.id} className="rounded-md border p-3">
                  <p className="font-medium text-sm">{source.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {source.content}
                  </p>
                  {source.tags && source.tags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Tags: {source.tags.join(", ")}
                    </p>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
    </div>
  );
}
