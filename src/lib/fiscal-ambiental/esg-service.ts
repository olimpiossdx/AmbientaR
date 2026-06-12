import { adminDb } from "@/lib/firebase-admin";
import { listChangeAnalyses } from "./change-analysis-service";
import { listFiscalFindings, summarizeFindings } from "./fiscal-finding-service";
import { listMosaicsForWorkspace } from "./mosaic-service";
import { getFadWorkspace } from "./workspace-service";
import type {
  FadEsgDashboard,
  FadEsgExplanations,
  FadEsgIndicators,
  FadEsgScores,
  FadEsgSnapshot,
  FadWorkspace,
} from "./types";

const SUB = "esg_snapshots";

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function snapshotsCol(workspaceId: string) {
  return adminDb().collection("fad_workspaces").doc(workspaceId).collection(SUB);
}

function docToSnapshot(id: string, data: FirebaseFirestore.DocumentData): FadEsgSnapshot {
  return { id, ...(data as Omit<FadEsgSnapshot, "id">) };
}

export function computeEsgMetrics(params: {
  workspace: FadWorkspace;
  mosaicCount: number;
  latestAnalysis?: {
    gainHa: number;
    lossHa: number;
    bareHa: number;
    beforeDate: string;
    afterDate: string;
  };
  findingStats: ReturnType<typeof summarizeFindings>;
  appInterventionCount: number;
}): { indicators: FadEsgIndicators; scores: FadEsgScores; explanations: FadEsgExplanations } {
  const areaHa = params.workspace.areaHa ?? 100;
  const gain = params.latestAnalysis?.gainHa ?? 0;
  const loss = params.latestAnalysis?.lossHa ?? 0;
  const bare = params.latestAnalysis?.bareHa ?? 0;
  const anthropized = Math.min(areaHa, loss + bare);
  const preserved = Math.max(0, areaHa - anthropized + gain * 0.5);
  const coverPct = clamp((preserved / areaHa) * 100);

  const indicators: FadEsgIndicators = {
    mosaicCount: params.mosaicCount,
    vegetationGainHa: gain,
    vegetationLossHa: loss,
    bareSoilHa: bare,
    preservedAreaHa: Math.round(preserved * 100) / 100,
    anthropizedAreaHa: Math.round(anthropized * 100) / 100,
    vegetationCoverPct: coverPct,
    openFindings: params.findingStats.open,
    criticalFindings: params.findingStats.bySeverity.critical,
    highFindings: params.findingStats.bySeverity.high,
    prodesAlerts: 0,
    appInterventionFindings: params.appInterventionCount,
    analysisPeriod: params.latestAnalysis
      ? `${params.latestAnalysis.beforeDate} → ${params.latestAnalysis.afterDate}`
      : undefined,
  };

  const envExpl: string[] = [];
  let environmental = 55;
  if (params.mosaicCount > 0) {
    environmental += 15;
    envExpl.push(`+15: acervo com ${params.mosaicCount} imagem(ns) satelital(is).`);
  } else {
    envExpl.push("Base 55: sem imagens no acervo (cobertura limitada).");
  }

  if (gain > 0) {
    const bonus = clamp((gain / areaHa) * 80, 0, 20);
    environmental += bonus;
    envExpl.push(`+${bonus}: indícios de ganho vegetal (~${gain} ha).`);
  }
  if (loss > 0) {
    const penalty = clamp((loss / areaHa) * 100, 0, 35);
    environmental -= penalty;
    envExpl.push(`-${penalty}: indícios de perda vegetal (~${loss} ha).`);
  }
  if (bare > 0) {
    const penalty = clamp((bare / areaHa) * 80, 0, 25);
    environmental -= penalty;
    envExpl.push(`-${penalty}: solo exposto detectado (~${bare} ha).`);
  }
  environmental = clamp(environmental);

  const compExpl: string[] = ["Base 100 pontos de conformidade interna FAD."];
  let compliance = 100;
  const { critical, high, medium, low } = params.findingStats.bySeverity;
  if (critical > 0) {
    compliance -= critical * 15;
    compExpl.push(`-${critical * 15}: ${critical} achado(s) crítico(s) aberto(s).`);
  }
  if (high > 0) {
    compliance -= high * 8;
    compExpl.push(`-${high * 8}: ${high} achado(s) de alta severidade.`);
  }
  if (medium > 0) {
    compliance -= medium * 3;
    compExpl.push(`-${medium * 3}: ${medium} achado(s) de severidade média.`);
  }
  if (low > 0) {
    compliance -= low * 1;
    compExpl.push(`-${low}: ${low} achado(s) de baixa severidade.`);
  }
  if (params.appInterventionCount > 0) {
    compliance -= params.appInterventionCount * 5;
    compExpl.push(
      `-${params.appInterventionCount * 5}: ${params.appInterventionCount} indício(s) de intervenção em área sensível.`,
    );
  }
  compliance = clamp(compliance);

  const riskExpl: string[] = [];
  const risk = clamp((100 - environmental) * 0.45 + (100 - compliance) * 0.55);
  riskExpl.push(
    `Risco = (100−ambiental)×0,45 + (100−conformidade)×0,55 = ${risk}.`,
  );
  riskExpl.push("Quanto maior o score de risco, maior a atenção recomendada.");

  return {
    indicators,
    scores: { environmental, compliance, risk },
    explanations: { environmental: envExpl, compliance: compExpl, risk: riskExpl },
  };
}

async function gatherMetrics(workspace: FadWorkspace) {
  const [mosaics, analyses, findings] = await Promise.all([
    listMosaicsForWorkspace(workspace.id),
    listChangeAnalyses(workspace.id),
    listFiscalFindings(workspace.id),
  ]);

  const readyMosaics = mosaics.filter((m) => m.status === "ready");
  const latestAnalysis = analyses.find((a) => a.status === "ready");
  const findingStats = summarizeFindings(findings);
  const appCount = findings.filter(
    (f) =>
      f.type === "app_intervention" &&
      (f.status === "open" || f.status === "under_review"),
  ).length;

  return computeEsgMetrics({
    workspace,
    mosaicCount: readyMosaics.length,
    latestAnalysis: latestAnalysis
      ? {
          gainHa: latestAnalysis.summary.gainHa,
          lossHa: latestAnalysis.summary.lossHa,
          bareHa: latestAnalysis.summary.bareHa,
          beforeDate: latestAnalysis.beforeDate,
          afterDate: latestAnalysis.afterDate,
        }
      : undefined,
    findingStats,
    appInterventionCount: appCount,
  });
}

export async function getEsgDashboard(workspaceId: string): Promise<FadEsgDashboard | null> {
  const workspace = await getFadWorkspace(workspaceId);
  if (!workspace) return null;

  const metrics = await gatherMetrics(workspace);
  const all = await listEsgSnapshots(workspaceId);
  const snapshots = all.slice(0, 5);

  return {
    workspaceId,
    workspaceName: workspace.name,
    indicators: metrics.indicators,
    scores: metrics.scores,
    explanations: metrics.explanations,
    latestSnapshot: snapshots[0],
    snapshots,
  };
}

export async function listEsgSnapshots(workspaceId: string): Promise<FadEsgSnapshot[]> {
  const snap = await snapshotsCol(workspaceId).get();
  return snap.docs
    .map((d) => docToSnapshot(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createEsgSnapshot(
  workspaceId: string,
  ownerId: string,
): Promise<FadEsgSnapshot> {
  const workspace = await getFadWorkspace(workspaceId);
  if (!workspace) {
    throw Object.assign(new Error("Workspace não encontrado."), { status: 404 });
  }

  const metrics = await gatherMetrics(workspace);
  const now = new Date().toISOString();
  const ref = snapshotsCol(workspaceId).doc();

  const payload: Omit<FadEsgSnapshot, "id"> = {
    workspaceId,
    ownerId,
    indicators: metrics.indicators,
    scores: metrics.scores,
    explanations: metrics.explanations,
    createdAt: now,
    createdBy: ownerId,
  };

  await ref.set(payload);
  return { id: ref.id, ...payload };
}
