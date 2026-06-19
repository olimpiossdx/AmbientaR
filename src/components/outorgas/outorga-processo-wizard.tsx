"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useFirebase,
  useCollection,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  type DocumentData,
} from "firebase/firestore";
import type {
  OutorgaProcesso,
  OutorgaEtapaProcesso,
  Empreendedor,
  Project,
} from "@/lib/types";
import { OutorgaChecklistDocumentos } from "./outorga-checklist-documentos";
import { OutorgaEstudoTrForm } from "./outorga-estudo-tr-form";
import {
  buildWaterPermitFromProcesso,
  getEtapaLabel,
  checklistProgress,
  isCadastroInicialCompleto,
  syncEstudoTrFromCadastro,
} from "@/lib/outorga-processo";
import { OutorgaFinalidadeSelect } from "@/components/outorgas/outorga-finalidade-select";
import { stripUndefinedDeep } from "@/lib/firestore-payload";
import {
  OUTORGA_ETAPAS_ORDEM,
  OUTORGA_MG_EXERCICIO_TAXAS,
  OUTORGA_MG_LINKS,
  OUTORGA_LINKS_LABELS,
  buildOutorgaLinksExternos,
  formatTaxaBrl,
  getModoUsoByCodigo,
} from "@/lib/outorga-mg-catalog";
import type { OutorgaEstudoTr, OutorgaLinksExternos } from "@/lib/types";
import {
  estudoTrMinimoPreenchido,
  mergeEstudoTr,
} from "@/lib/outorga-estudo-tr";
import {
  buildEmpreendedorSelectOptions,
  buildProjectSelectOptions,
  normalizeEntityId,
} from "@/lib/empreendedor-project-select";
import { CoordinateStringField } from "@/components/coordinates";

type Props = {
  processo: OutorgaProcesso;
  onUpdated?: (p: OutorgaProcesso) => void;
};

export function OutorgaProcessoWizard({ processo, onUpdated }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [local, setLocal] = React.useState(processo);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirebase();

  React.useEffect(() => {
    setLocal(processo);
  }, [processo]);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(
    empreendedoresQuery,
  );

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: allProjects } = useCollection<Project>(projectsQuery);

  const empreendedoresForSelect = React.useMemo(
    () =>
      buildEmpreendedorSelectOptions({
        list: empreendedores,
        selectedId: local.empreendedorId,
      }),
    [empreendedores, local.empreendedorId],
  );

  const projectsForSelect = React.useMemo(
    () =>
      buildProjectSelectOptions({
        allProjects,
        empreendedorId: local.empreendedorId,
        selectedProjectId: local.projectId,
      }),
    [allProjects, local.empreendedorId, local.projectId],
  );

  const modo = getModoUsoByCodigo(local.modoUsoCodigo);
  const prog = checklistProgress(local.checklistDocumentos);

  const referencias: OutorgaLinksExternos = React.useMemo(() => {
    const stored = local.linksExternos ?? {};
    const defaults = buildOutorgaLinksExternos(
      local.modoUsoCodigo,
    ) as OutorgaLinksExternos;
    return { ...defaults, ...stored };
  }, [local.linksExternos, local.modoUsoCodigo]);

  const estudoTrValues = React.useMemo(
    () => mergeEstudoTr(local.modoUsoCodigo, local.estudoTr),
    [local.modoUsoCodigo, local.estudoTr],
  );

  const setEstudoTr = (estudoTr: OutorgaEstudoTr) => {
    setLocal((s) => ({ ...s, estudoTr }));
  };

  const salvarEstudoTr = async () => {
    const patch: Partial<OutorgaProcesso> = {
      estudoTr: estudoTrValues,
      linksExternos: referencias,
    };
    const finalidadeDraft = estudoTrValues.finalidade_tabela03?.trim();
    if (finalidadeDraft) patch.finalidade = finalidadeDraft;
    const vazao = estudoTrValues.vazao_requerida?.trim();
    if (vazao) patch.vazaoRequerida = vazao;
    const mun = estudoTrValues.municipio_uf?.trim();
    if (mun) patch.municipio = mun;
    const coord = estudoTrValues.coordenadas_ponto?.trim();
    if (coord) patch.coordenadas = coord;

    const em = new Date().toISOString();
    const avancarDoc =
      estudoTrMinimoPreenchido(estudoTrValues) &&
      (local.etapaProcesso === "rascunho" ||
        local.etapaProcesso === "elaboracao_estudos") &&
      !local.historicoEtapas.some((h) => h.etapa === "documentacao");

    if (avancarDoc) {
      patch.etapaProcesso = "documentacao";
      patch.historicoEtapas = [
        ...local.historicoEtapas,
        {
          etapa: "documentacao",
          em,
          nota: "Estudo técnico mínimo preenchido — montagem documental",
        },
      ];
    }

    await persist(patch, { silent: avancarDoc });
    if (avancarDoc) {
      toast({
        title: "Estudo salvo",
        description:
          "Etapa avançada para Documentação. Revise o checklist e anexos.",
      });
    }
  };

  const referenciaEntries = React.useMemo(
    () =>
      (
        Object.entries(referencias) as [keyof OutorgaLinksExternos, string][]
      ).filter(
        ([key, url]) =>
          key !== "trTitulo" &&
          typeof url === "string" &&
          url.startsWith("http"),
      ),
    [referencias],
  );

  const persist = async (
    patch: Partial<OutorgaProcesso>,
    opts?: { silent?: boolean },
  ) => {
    if (!firestore) return;
    setLoading(true);
    const docRef = doc(firestore, "outorga_processos", local.id);
    const updatedAt = new Date().toISOString();
    const data = stripUndefinedDeep({ ...patch, updatedAt });
    try {
      await updateDoc(docRef, data as DocumentData);
      const next = { ...local, ...patch, updatedAt } as OutorgaProcesso;
      setLocal(next);
      onUpdated?.(next);
      if (!opts?.silent) {
        toast({ title: "Processo salvo" });
      }
    } catch {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: "update",
        requestResourceData: data,
      });
      errorEmitter.emit("permission-error", permissionError);
    } finally {
      setLoading(false);
    }
  };

  const avancarEtapa = (nova: OutorgaEtapaProcesso, nota?: string) => {
    const em = new Date().toISOString();
    const historico = [
      ...local.historicoEtapas,
      { etapa: nova, em, nota },
    ];
    void persist({
      etapaProcesso: nova,
      historicoEtapas: historico,
    });
  };

  const syncPortariaDeferida = async () => {
    if (!firestore || !local.empreendedorId) {
      toast({
        variant: "destructive",
        title: "Selecione o empreendedor antes de registrar a portaria.",
      });
      return;
    }
    const permitNumber = window.prompt("Número da portaria (ex.: IGAM nº ...)");
    if (!permitNumber?.trim()) return;
    const issueStr = window.prompt("Data de emissão (AAAA-MM-DD)");
    const expStr = window.prompt("Data de vencimento (AAAA-MM-DD)");
    if (!issueStr || !expStr) return;

    setLoading(true);
    try {
      const permitData = stripUndefinedDeep(
        buildWaterPermitFromProcesso(local, {
          permitNumber: permitNumber.trim(),
          issueDate: new Date(issueStr).toISOString(),
          expirationDate: new Date(expStr).toISOString(),
        }),
      );
      const outorgaRef = await addDoc(
        collection(firestore, "outorgas"),
        permitData as DocumentData,
      );
      await updateDoc(doc(firestore, "outorga_processos", local.id), {
        etapaProcesso: "publicado",
        outorgaId: outorgaRef.id,
        historicoEtapas: [
          ...local.historicoEtapas,
          {
            etapa: "publicado" as const,
            em: new Date().toISOString(),
            nota: `Portaria vinculada: ${permitNumber}`,
          },
        ],
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Portaria registrada",
        description: "Outorga vigente criada. Acompanhe em Documentos Ambientais → Outorgas.",
      });
      router.push(`/outorgas`);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao criar portaria",
      });
    } finally {
      setLoading(false);
    }
  };

  const etapaIndex = OUTORGA_ETAPAS_ORDEM.indexOf(local.etapaProcesso);
  const cadastroCompleto = isCadastroInicialCompleto(local);
  const projectName = projectsForSelect.find(
    (p) => p.id === normalizeEntityId(local.projectId),
  )?.propertyName;

  const salvarCadastroInicial = async () => {
    if (!local.empreendedorId?.trim()) {
      toast({
        variant: "destructive",
        title: "Empreendedor obrigatório",
        description: "Selecione o empreendedor para iniciar o processo.",
      });
      return;
    }
    if (!local.finalidade?.trim()) {
      toast({
        variant: "destructive",
        title: "Finalidade obrigatória",
        description: "Selecione a finalidade do uso (Tabela 03 IGAM).",
      });
      return;
    }
    const estudoTr = syncEstudoTrFromCadastro(
      local.modoUsoCodigo,
      local,
      projectName,
    );
    const patch: Partial<OutorgaProcesso> = {
      empreendedorId: local.empreendedorId,
      finalidade: local.finalidade,
      processNumber: local.processNumber,
      linksExternos: referencias,
      estudoTr,
    };
    if (local.projectId) patch.projectId = local.projectId;
    if (local.municipio) patch.municipio = local.municipio;
    if (local.coordenadas) patch.coordenadas = local.coordenadas;
    if (local.vazaoRequerida) patch.vazaoRequerida = local.vazaoRequerida;
    await persist(patch);
    setEstudoTr(estudoTr);
    toast({
      title: "Cadastro salvo",
      description:
        "Agora preencha o estudo técnico, o checklist e as etapas do processo.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={cadastroCompleto ? "default" : "secondary"}>
          1. Cadastro inicial
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={cadastroCompleto ? "secondary" : "outline"}>
          2. Estudo, documentos e etapas
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              Cód. {local.modoUsoCodigo}
            </Badge>
            <Badge>{getEtapaLabel(local.etapaProcesso)}</Badge>
          </div>
          <CardTitle className="text-lg">{local.modoUsoLabel}</CardTitle>
          <CardDescription>
            Taxa ref.: {formatTaxaBrl(local.taxaServico?.valorBrl)} · Exercício{" "}
            {local.taxaServico?.exercicio ?? OUTORGA_MG_EXERCICIO_TAXAS}
          </CardDescription>
        </CardHeader>
        {cadastroCompleto && (
          <CardContent className="space-y-3">
            {referencias.trTitulo && (
              <p className="text-sm text-muted-foreground">
                {referencias.trTitulo}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {referenciaEntries.map(([key, url]) => (
                <Button key={key} variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1 shrink-0" />
                    {OUTORGA_LINKS_LABELS[key] ?? key}
                  </a>
                </Button>
              ))}
              <Button variant="outline" size="sm" asChild>
                <a href="/studies/assistant?tipo=outorga">
                  Assistente IA — outorga
                </a>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastro inicial</CardTitle>
          <CardDescription>
            Empreendedor, empreendimento e finalidade do uso (Tabela 03). Salve
            para liberar o estudo técnico e a documentação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Empreendedor *</Label>
            <Select
              value={local.empreendedorId || ""}
              onValueChange={(v) => {
                setLocal((s) => ({ ...s, empreendedorId: v, projectId: "" }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {empreendedoresForSelect.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Empreendimento</Label>
            <Select
              value={normalizeEntityId(local.projectId) || ""}
              onValueChange={(v) =>
                setLocal((s) => ({ ...s, projectId: v || undefined }))
              }
              disabled={!local.empreendedorId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {projectsForSelect.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.propertyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Finalidade do uso *</Label>
            <OutorgaFinalidadeSelect
              value={local.finalidade}
              onValueChange={(finalidade) =>
                setLocal((s) => ({ ...s, finalidade }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nº processo (SOUT/SEI)</Label>
              <Input
                value={local.processNumber ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, processNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Município</Label>
              <Input
                value={local.municipio ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, municipio: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Coordenadas / localização</Label>
            <CoordinateStringField
              value={local.coordenadas ?? ""}
              onChange={(coordenadas) =>
                setLocal((s) => ({ ...s, coordenadas }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Vazão requerida</Label>
            <Input
              value={local.vazaoRequerida ?? ""}
              onChange={(e) =>
                setLocal((s) => ({ ...s, vazaoRequerida: e.target.value }))
              }
            />
          </div>
          <Button
            type="button"
            disabled={loading || !local.empreendedorId || !local.finalidade?.trim()}
            onClick={() => void salvarCadastroInicial()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {cadastroCompleto ? "Atualizar cadastro" : "Salvar e continuar"}
          </Button>
        </CardContent>
      </Card>

      {!cadastroCompleto ? (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/20">
          Preencha e salve o cadastro inicial para acessar o estudo técnico, o
          checklist documental e as etapas do processo.
        </p>
      ) : (
        <>
      <OutorgaEstudoTrForm
        modoUsoCodigo={local.modoUsoCodigo}
        modoUsoLabel={local.modoUsoLabel}
        formularioTecnico={modo?.formularioTecnico}
        taxaValorBrl={local.taxaServico?.valorBrl}
        trPdfUrl={referencias.trPdfUrl}
        values={estudoTrValues}
        onChange={setEstudoTr}
        onSave={salvarEstudoTr}
        saving={loading}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist documental</CardTitle>
          <CardDescription>
            Decreto 47.705/2019 (art. 21) + TR código {local.modoUsoCodigo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OutorgaChecklistDocumentos
            items={local.checklistDocumentos}
            onChange={(checklistDocumentos) => {
              setLocal((s) => ({ ...s, checklistDocumentos }));
            }}
          />
          <Button
            type="button"
            className="mt-4"
            variant="secondary"
            disabled={loading}
            onClick={() => {
              void persist({ checklistDocumentos: local.checklistDocumentos });
              if (
                prog.obrigatoriosPendentes === 0 &&
                (local.etapaProcesso === "elaboracao_estudos" ||
                  local.etapaProcesso === "rascunho")
              ) {
                avancarEtapa("documentacao", "Checklist documental completo");
              }
            }}
          >
            Salvar checklist
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Etapas do processo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {OUTORGA_ETAPAS_ORDEM.filter((e) => e !== "indeferido").map(
              (e, i) => (
                <Badge
                  key={e}
                  variant={i <= etapaIndex ? "default" : "outline"}
                  className="text-xs"
                >
                  {getEtapaLabel(e)}
                </Badge>
              ),
            )}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() =>
                avancarEtapa("elaboracao_estudos", "Retomar elaboração do estudo")
              }
            >
              Elaboração estudos
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => avancarEtapa("taxa_paga", "Taxa DAE paga")}
            >
              Marcar taxa paga
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => avancarEtapa("protocolado", "Protocolo SOUT")}
            >
              Marcar protocolado
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => avancarEtapa("analise")}
            >
              Em análise
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => avancarEtapa("exigencia")}
            >
              Exigência
            </Button>
            <Button
              size="sm"
              disabled={loading}
              onClick={() => avancarEtapa("deferido", "Deferido pelo IGAM")}
            >
              Deferido
            </Button>
          </div>
          {local.etapaProcesso === "deferido" && !local.outorgaId && (
            <Button onClick={syncPortariaDeferida} disabled={loading}>
              Registrar portaria vigente
            </Button>
          )}
          {local.outorgaId && (
            <p className="text-sm text-muted-foreground">
              Portaria vinculada — ID {local.outorgaId}. Gerencie em{" "}
              <Button
                variant="link"
                className="h-auto p-0"
                onClick={() => router.push("/outorgas")}
              >
                Outorgas (documentos ambientais)
              </Button>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Limites outorgados (pós-concessão)
          </CardTitle>
          <CardDescription>
            Repassados à portaria ao registrar o deferimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Limite mensal (m³)</Label>
            <Input
              type="number"
              value={local.monthlyLimitM3 ?? ""}
              onChange={(e) =>
                setLocal((s) => ({
                  ...s,
                  monthlyLimitM3: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Limite diário (m³)</Label>
            <Input
              type="number"
              value={local.dailyLimitM3 ?? ""}
              onChange={(e) =>
                setLocal((s) => ({
                  ...s,
                  dailyLimitM3: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Horas/dia</Label>
            <Input
              type="number"
              value={local.dailyHoursLimit ?? ""}
              onChange={(e) =>
                setLocal((s) => ({
                  ...s,
                  dailyHoursLimit: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Dias/mês máx.</Label>
            <Input
              type="number"
              value={local.maxDaysPerMonth ?? ""}
              onChange={(e) =>
                setLocal((s) => ({
                  ...s,
                  maxDaysPerMonth: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>
          <Button
            className="sm:col-span-2"
            variant="secondary"
            disabled={loading}
            onClick={() =>
              persist({
                monthlyLimitM3: local.monthlyLimitM3,
                dailyLimitM3: local.dailyLimitM3,
                dailyHoursLimit: local.dailyHoursLimit,
                maxDaysPerMonth: local.maxDaysPerMonth,
              })
            }
          >
            Salvar limites
          </Button>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
