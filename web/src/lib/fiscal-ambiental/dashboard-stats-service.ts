import { listChangeAnalyses } from "./change-analysis-service";
import { listEvidenceItems } from "./evidence-service";
import { listFiscalFindings } from "./fiscal-finding-service";
import { listMosaicsForWorkspace } from "./mosaic-service";
import { listMonitoringRules } from "./monitoring-service";
import { listSmartReports } from "./report-service";
import type { FadDashboardStats } from "./types";
import { listFadWorkspacesForOwner } from "./workspace-service";

async function statsForWorkspace(workspaceId: string): Promise<{
  readyMosaics: number;
  totalMosaics: number;
  lastMosaicDate: string | null;
  openFindings: number;
  monitoringRules: number;
  reports: number;
  evidence: number;
  analyses: number;
}> {
  const [mosaics, findings, rules, reports, evidence, analyses] = await Promise.all([
    listMosaicsForWorkspace(workspaceId),
    listFiscalFindings(workspaceId),
    listMonitoringRules(workspaceId),
    listSmartReports(workspaceId),
    listEvidenceItems(workspaceId),
    listChangeAnalyses(workspaceId),
  ]);

  const ready = mosaics.filter((m) => m.status === "ready");
  const lastDate =
    ready.length > 0
      ? ready.reduce((best, m) => {
          const d = m.sceneDate ?? m.requestedDate;
          return d > best ? d : best;
        }, ready[0]!.sceneDate ?? ready[0]!.requestedDate)
      : null;

  return {
    readyMosaics: ready.length,
    totalMosaics: mosaics.length,
    lastMosaicDate: lastDate,
    openFindings: findings.filter((f) => f.status === "open").length,
    monitoringRules: rules.length,
    reports: reports.length,
    evidence: evidence.length,
    analyses: analyses.length,
  };
}

export async function getFadDashboardStatsForOwner(ownerId: string): Promise<FadDashboardStats> {
  const workspaces = await listFadWorkspacesForOwner(ownerId);

  if (workspaces.length === 0) {
    return {
      workspaceCount: 0,
      readyMosaicCount: 0,
      totalMosaicCount: 0,
      lastMosaicDate: null,
      openFindingsCount: 0,
      monitoringRuleCount: 0,
      reportCount: 0,
      evidenceCount: 0,
      changeAnalysisCount: 0,
    };
  }

  const perWorkspace = await Promise.all(workspaces.map((ws) => statsForWorkspace(ws.id)));

  let lastMosaicDate: string | null = null;
  for (const s of perWorkspace) {
    if (s.lastMosaicDate && (!lastMosaicDate || s.lastMosaicDate > lastMosaicDate)) {
      lastMosaicDate = s.lastMosaicDate;
    }
  }

  return {
    workspaceCount: workspaces.length,
    readyMosaicCount: perWorkspace.reduce((n, s) => n + s.readyMosaics, 0),
    totalMosaicCount: perWorkspace.reduce((n, s) => n + s.totalMosaics, 0),
    lastMosaicDate,
    openFindingsCount: perWorkspace.reduce((n, s) => n + s.openFindings, 0),
    monitoringRuleCount: perWorkspace.reduce((n, s) => n + s.monitoringRules, 0),
    reportCount: perWorkspace.reduce((n, s) => n + s.reports, 0),
    evidenceCount: perWorkspace.reduce((n, s) => n + s.evidence, 0),
    changeAnalysisCount: perWorkspace.reduce((n, s) => n + s.analyses, 0),
  };
}
