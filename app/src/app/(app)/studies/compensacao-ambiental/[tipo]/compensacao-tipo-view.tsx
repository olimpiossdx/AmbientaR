"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CompensacaoChecklistPanel } from "@/components/compensacao-ambiental/compensacao-checklist-panel";
import { CompensacaoProcessoCard } from "@/components/compensacao-ambiental/compensacao-processo-card";
import {
  getCompensacaoTipoMeta,
  isCompensacaoTipo,
  type CompensacaoTipo,
} from "@/lib/compensacao-ambiental/config";
import {
  loadCompensacaoDraftFromFirestore,
  saveCompensacaoDraftToFirestore,
} from "@/lib/compensacao-ambiental/firestore-draft";
import {
  createEmptyDraft,
  loadCompensacaoDraft,
  saveCompensacaoDraft,
  type CompensacaoProcessoDraft,
} from "@/lib/compensacao-ambiental/storage";
import { useFirebase } from "@/firebase";
import { ArrowLeft, Cloud, CloudOff, ExternalLink, Info } from "lucide-react";

export function CompensacaoTipoView() {
  const params = useParams();
  const tipoParam = typeof params?.tipo === "string" ? params.tipo : "";
  if (!isCompensacaoTipo(tipoParam)) {
    notFound();
  }
  const tipo = tipoParam as CompensacaoTipo;
  const meta = getCompensacaoTipoMeta(tipo);
  const { firestore, user } = useFirebase();

  const [draft, setDraft] = useState<CompensacaoProcessoDraft | null>(null);
  const [cloudSync, setCloudSync] = useState<"loading" | "cloud" | "local" | "error">(
    "loading",
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = loadCompensacaoDraft(tipo);
      if (!firestore || !user?.uid) {
        if (!cancelled) {
          setDraft(local ?? createEmptyDraft());
          setCloudSync("local");
        }
        return;
      }

      try {
        const remote = await loadCompensacaoDraftFromFirestore(
          firestore,
          user.uid,
          tipo,
        );
        if (cancelled) return;

        if (remote) {
          setDraft(remote);
          saveCompensacaoDraft(tipo, remote);
          setCloudSync("cloud");
          return;
        }

        if (local) {
          setDraft(local);
          setCloudSync("local");
          await saveCompensacaoDraftToFirestore(firestore, user.uid, tipo, local);
          if (!cancelled) setCloudSync("cloud");
          return;
        }

        const empty = createEmptyDraft();
        setDraft(empty);
        setCloudSync("local");
      } catch (err) {
        console.error("compensacao_drafts load:", err);
        if (!cancelled) {
          setDraft(local ?? createEmptyDraft());
          setCloudSync("error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [firestore, tipo, user?.uid]);

  const persist = useCallback(
    (next: CompensacaoProcessoDraft) => {
      setDraft(next);
      saveCompensacaoDraft(tipo, next);

      if (!firestore || !user?.uid) {
        setCloudSync("local");
        return;
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void saveCompensacaoDraftToFirestore(firestore, user.uid!, tipo, next)
          .then(() => setCloudSync("cloud"))
          .catch((err) => {
            console.error("compensacao_drafts save:", err);
            setCloudSync("error");
          });
      }, 600);
    },
    [firestore, tipo, user?.uid],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  if (!draft) {
    return (
      <div className="flex flex-col h-full p-6">
        <p className="text-muted-foreground text-sm">A carregar checklist…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={meta.label}>
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link href="/studies/compensacao-ambiental">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <a href={meta.referenciaIef} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Referência IEF
          </a>
        </Button>
        {cloudSync === "cloud" ? (
          <Badge variant="secondary" className="gap-1">
            <Cloud className="h-3 w-3" />
            Sincronizado
          </Badge>
        ) : cloudSync === "error" ? (
          <Badge variant="destructive" className="gap-1">
            <CloudOff className="h-3 w-3" />
            Só local
          </Badge>
        ) : cloudSync === "local" ? (
          <Badge variant="outline" className="gap-1">
            <CloudOff className="h-3 w-3" />
            Rascunho local
          </Badge>
        ) : null}
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Checklist e modelos Word</AlertTitle>
          <AlertDescription>
            Com login, o progresso sincroniza em{" "}
            <code className="text-xs bg-muted px-1 rounded">compensacao_drafts</code> (um
            processo por tipo e utilizador). Mantém cópia local no navegador. Exportação
            PDF/Word automática continua planeada.
            {meta.processoSei && (
              <>
                {" "}
                Tipo de processo no SEI: <strong>{meta.processoSei}</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>

        <CompensacaoProcessoCard tipo={tipo} draft={draft} onChange={persist} />
        <CompensacaoChecklistPanel
          tipo={tipo}
          draft={draft}
          onChange={persist}
          referenciaIef={meta.referenciaIef}
        />
      </main>
    </div>
  );
}
