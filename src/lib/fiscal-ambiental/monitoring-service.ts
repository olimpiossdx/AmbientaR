import { adminDb } from "@/lib/firebase-admin";
import { assembleMosaicForDate } from "./assemble-service";
import { runChangeDetection } from "./change-analysis-service";
import { listFiscalFindings, runFiscalChecks, summarizeFindings } from "./fiscal-finding-service";
import { fetchInpeAvailabilityForYear } from "./inpe-stac-client";
import { listMosaicsForWorkspace } from "./mosaic-service";
import { recordMonitoringRunEvent } from "./timeline-service";
import { getFadWorkspace } from "./workspace-service";
import type {
  CreateFadMonitoringRuleInput,
  FadMonitoringAlertLevel,
  FadMonitoringFrequency,
  FadMonitoringRun,
  FadMonitoringRunStep,
  FadMonitoringRule,
  FadWorkspace,
} from "./types";

const RULES_SUB = "monitoring_rules";
const RUNS_SUB = "monitoring_runs";

function rulesCol(workspaceId: string) {
  return adminDb().collection("fad_workspaces").doc(workspaceId).collection(RULES_SUB);
}

function runsCol(workspaceId: string) {
  return adminDb().collection("fad_workspaces").doc(workspaceId).collection(RUNS_SUB);
}

function docToRule(id: string, data: FirebaseFirestore.DocumentData): FadMonitoringRule {
  return { id, ...(data as Omit<FadMonitoringRule, "id">) };
}

function docToRun(id: string, data: FirebaseFirestore.DocumentData): FadMonitoringRun {
  return { id, ...(data as Omit<FadMonitoringRun, "id">) };
}

function alertLevelFromFindings(
  bySeverity: { low: number; medium: number; high: number; critical: number },
): FadMonitoringAlertLevel {
  if (bySeverity.critical > 0) return "critical";
  if (bySeverity.high > 0) return "high";
  if (bySeverity.medium > 0) return "medium";
  if (bySeverity.low > 0) return "low";
  return "none";
}

async function findBestRecentDate(aoi: FadWorkspace["aoi"]): Promise<string | null> {
  if (!aoi) return null;
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() - 1];
  let bestDate: string | null = null;
  let bestCloud = Infinity;

  for (const year of years) {
    const days = await fetchInpeAvailabilityForYear(aoi, year);
    for (const d of days) {
      if (d.quality === "none") continue;
      const cloud = d.cloudCover ?? 50;
      if (cloud < bestCloud) {
        bestCloud = cloud;
        bestDate = d.date;
      }
    }
  }

  return bestDate;
}

export async function listMonitoringRules(workspaceId: string): Promise<FadMonitoringRule[]> {
  const snap = await rulesCol(workspaceId).get();
  return snap.docs
    .map((d) => docToRule(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMonitoringRule(
  workspaceId: string,
  ownerId: string,
  input: CreateFadMonitoringRuleInput,
): Promise<FadMonitoringRule> {
  const now = new Date().toISOString();
  const ref = rulesCol(workspaceId).doc();
  const payload: Omit<FadMonitoringRule, "id"> = {
    workspaceId,
    ownerId,
    name: input.name.trim(),
    frequency: input.frequency,
    enabled: true,
    createdAt: now,
    createdBy: ownerId,
    updatedAt: now,
  };
  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function updateMonitoringRule(
  workspaceId: string,
  ruleId: string,
  patch: Partial<Pick<FadMonitoringRule, "name" | "frequency" | "enabled">>,
): Promise<FadMonitoringRule | null> {
  const ref = rulesCol(workspaceId).doc(ruleId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ ...patch, updatedAt: new Date().toISOString() });
  const updated = await ref.get();
  return docToRule(updated.id, updated.data()!);
}

export async function deleteMonitoringRule(workspaceId: string, ruleId: string): Promise<boolean> {
  const ref = rulesCol(workspaceId).doc(ruleId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function listMonitoringRuns(workspaceId: string): Promise<FadMonitoringRun[]> {
  const snap = await runsCol(workspaceId).get();
  return snap.docs
    .map((d) => docToRun(d.id, d.data()))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getMonitoringRule(
  workspaceId: string,
  ruleId: string,
): Promise<FadMonitoringRule | null> {
  const snap = await rulesCol(workspaceId).doc(ruleId).get();
  if (!snap.exists) return null;
  return docToRule(snap.id, snap.data()!);
}

export async function executeMonitoringRun(params: {
  workspaceId: string;
  ruleId: string;
  ownerId: string;
}): Promise<FadMonitoringRun> {
  const workspace = await getFadWorkspace(params.workspaceId);
  if (!workspace?.aoi) {
    throw Object.assign(new Error("Workspace sem AOI definida."), { status: 400 });
  }

  const rule = await getMonitoringRule(params.workspaceId, params.ruleId);
  if (!rule) {
    throw Object.assign(new Error("Regra de monitoramento não encontrada."), { status: 404 });
  }
  if (!rule.enabled) {
    throw Object.assign(new Error("Regra desativada."), { status: 400 });
  }

  const runRef = runsCol(params.workspaceId).doc();
  const startedAt = new Date().toISOString();
  const steps: FadMonitoringRunStep[] = [];

  const baseRun: Omit<FadMonitoringRun, "id"> = {
    workspaceId: params.workspaceId,
    ruleId: params.ruleId,
    ownerId: params.ownerId,
    status: "running",
    steps: [],
    startedAt,
    createdBy: params.ownerId,
  };

  await runRef.set(baseRun);

  try {
    // 1. Nova imagem INPE (melhor dia recente)
    let latestMosaicId: string | undefined;
    let latestDate: string | undefined;

    const bestDate = await findBestRecentDate(workspace.aoi);
    if (bestDate) {
      try {
        const mosaic = await assembleMosaicForDate({
          workspaceId: params.workspaceId,
          ownerId: params.ownerId,
          aoi: workspace.aoi,
          date: bestDate,
        });
        latestMosaicId = mosaic.id;
        latestDate = mosaic.requestedDate;
        steps.push({ step: "inpe_mosaic", status: "ok", message: `Imagem ${bestDate}` });
      } catch (e) {
        steps.push({
          step: "inpe_mosaic",
          status: "skipped",
          message: e instanceof Error ? e.message : "Falha ao montar imagem",
        });
      }
    } else {
      steps.push({ step: "inpe_mosaic", status: "skipped", message: "Sem cena recente no INPE" });
    }

    // 2. Duas datas para comparação
    const mosaics = (await listMosaicsForWorkspace(params.workspaceId))
      .filter((m) => m.status === "ready")
      .sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));

    if (!latestMosaicId && mosaics[0]) {
      latestMosaicId = mosaics[0].id;
      latestDate = mosaics[0].requestedDate;
    }

    const beforeMosaic = mosaics.find((m) => m.id !== latestMosaicId);
    let analysisId: string | undefined;
    let previousDate: string | undefined;

    if (latestMosaicId && beforeMosaic) {
      previousDate = beforeMosaic.requestedDate;
      try {
        const analysis = await runChangeDetection({
          workspace,
          ownerId: params.ownerId,
          beforeMosaicId: beforeMosaic.id,
          afterMosaicId: latestMosaicId,
        });
        analysisId = analysis.id;
        steps.push({
          step: "change_detection",
          status: "ok",
          message: `~${analysis.summary.totalChangedHa} ha alterados`,
        });
      } catch (e) {
        steps.push({
          step: "change_detection",
          status: "failed",
          message: e instanceof Error ? e.message : "Falha na análise",
        });
      }
    } else {
      steps.push({
        step: "change_detection",
        status: "skipped",
        message: "São necessárias duas imagens no acervo",
      });
    }

    // 3. Fiscalização preventiva (+ SIG opcional)
    let findingsCreated = 0;
    try {
      const fiscal = await runFiscalChecks({
        workspaceId: params.workspaceId,
        ownerId: params.ownerId,
      });
      findingsCreated = fiscal.created;
      const sigNote =
        fiscal.sigCrosscheck?.enabled && fiscal.sigCrosscheck.created > 0
          ? ` (incl. ${fiscal.sigCrosscheck.created} SIG)`
          : "";
      steps.push({
        step: "fiscal_checks",
        status: "ok",
        message: `${findingsCreated} achado(s) novo(s)${sigNote}`,
      });
    } catch (e) {
      steps.push({
        step: "fiscal_checks",
        status: "failed",
        message: e instanceof Error ? e.message : "Falha nos achados",
      });
    }

    const allFindings = await listFiscalFindings(params.workspaceId);
    const summaryStats = summarizeFindings(allFindings);
    const alertLevel = alertLevelFromFindings(summaryStats.bySeverity);

    const completedAt = new Date().toISOString();
    const completed: Omit<FadMonitoringRun, "id"> = {
      ...baseRun,
      status: "completed",
      steps,
      summary: {
        latestMosaicId,
        beforeMosaicId: beforeMosaic?.id,
        analysisId,
        findingsCreated,
        openFindings: summaryStats.open,
        alertLevel,
        latestDate,
        previousDate,
      },
      completedAt,
    };

    await runRef.update(completed as Record<string, unknown>);
    await rulesCol(params.workspaceId).doc(params.ruleId).update({
      lastRunAt: completedAt,
      updatedAt: completedAt,
    });

    const run = docToRun(runRef.id, completed);
    await recordMonitoringRunEvent(params.workspaceId, params.ownerId, rule.name, alertLevel).catch(
      () => undefined,
    );
    return run;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha no monitoramento.";
    await runRef.update({
      status: "failed",
      steps,
      errorMessage: msg,
      completedAt: new Date().toISOString(),
    });
    throw e;
  }
}
