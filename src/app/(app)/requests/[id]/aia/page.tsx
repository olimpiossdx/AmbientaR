"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirebase, useAuth, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import type { Project, Request } from "@/lib/types";
import {
  DEFAULT_AIA_PROFILE,
  INTERVENTION_SERVICE_LABEL,
  mergeInterventionChecklist,
  normalizeInterventionSubserviceIds,
  buildInterventionChecklist,
} from "@/lib/intervention-checklist";
import { AiaWorkflowPanel, applyImovelFromProject } from "@/components/processos/aia-workflow-panel";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Loader2 } from "lucide-react";
import { canWriteProcessosInternal } from "@/lib/role-guards";

export default function RequestAiaPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = typeof params?.id === "string" ? params.id : "";
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const requestRef = React.useMemo(
    () => (firestore && requestId ? doc(firestore, "requests", requestId) : null),
    [firestore, requestId],
  );
  const { data: request, isLoading } = useDoc<Request>(requestRef);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  const project = React.useMemo(
    () => projects?.find((p) => p.id === request?.projectId) ?? null,
    [projects, request?.projectId],
  );

  const [checklist, setChecklist] = React.useState(request?.interventionChecklist ?? []);
  const [subservices, setSubservices] = React.useState(
    normalizeInterventionSubserviceIds(request?.interventionSubservices),
  );
  const [tipoIntervencao, setTipoIntervencao] = React.useState(request?.tipoIntervencao);
  const [imovelSnapshot, setImovelSnapshot] = React.useState(request?.imovelSnapshot ?? {});
  const [aiaProfile, setAiaProfile] = React.useState(request?.aiaProfile ?? { ...DEFAULT_AIA_PROFILE });
  const [linkedArtifacts, setLinkedArtifacts] = React.useState(request?.linkedArtifacts ?? {});

  React.useEffect(() => {
    if (!request) return;
    if (!request.services.includes(INTERVENTION_SERVICE_LABEL)) {
      router.replace(`/requests/${requestId}/edit`);
      return;
    }
    const subs = normalizeInterventionSubserviceIds(request.interventionSubservices);
    const imovel = request.imovelSnapshot ?? applyImovelFromProject(project, {});
    const ctx = {
      subservices: subs,
      imovel,
      tipoIntervencao: request.tipoIntervencao,
      orgao: request.aiaProfile?.orgao,
      uf: request.aiaProfile?.uf,
    };
    setChecklist(
      request.interventionChecklist?.length
        ? mergeInterventionChecklist(request.interventionChecklist, ctx)
        : buildInterventionChecklist(ctx),
    );
    setSubservices(subs);
    setTipoIntervencao(request.tipoIntervencao);
    setImovelSnapshot(imovel);
    setAiaProfile(request.aiaProfile ?? { ...DEFAULT_AIA_PROFILE });
    setLinkedArtifacts(request.linkedArtifacts ?? {});
  }, [request, project, requestId, router]);

  const readOnly = !user || !canWriteProcessosInternal(user.role);

  const save = async () => {
    if (!firestore || !request || readOnly) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "requests", request.id), {
        interventionChecklist: checklist,
        interventionSubservices: subservices,
        imovelSnapshot,
        aiaProfile,
        linkedArtifacts,
        ...(tipoIntervencao ? { tipoIntervencao } : {}),
      });
      toast({ title: "Fluxo AIA salvo" });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível gravar o checklist.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !request) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Fluxo AIA" />
        <main className="flex-1 p-6">
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Autorização para Intervenção Ambiental"
        description={`Trâmite ${request.solicitationNumber ?? request.id.slice(0, 8)}`}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/requests/${requestId}/edit`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar à edição
            </Link>
          </Button>
          {!readOnly && (
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar fluxo AIA
            </Button>
          )}
        </div>
        <AiaWorkflowPanel
          requestId={requestId}
          empreendedorId={request.empreendedorId}
          projectId={request.projectId}
          interventionSubservices={subservices}
          onSubservicesChange={setSubservices}
          tipoIntervencao={tipoIntervencao}
          onTipoIntervencaoChange={setTipoIntervencao}
          imovelSnapshot={imovelSnapshot}
          onImovelSnapshotChange={setImovelSnapshot}
          aiaProfile={aiaProfile}
          checklist={checklist}
          onChecklistChange={setChecklist}
          linkedArtifacts={linkedArtifacts}
          onLinkedArtifactsChange={setLinkedArtifacts}
          uploadStoragePrefix="requests/intervencao"
          showMergeTemplate={!readOnly}
        />
      </main>
    </div>
  );
}
