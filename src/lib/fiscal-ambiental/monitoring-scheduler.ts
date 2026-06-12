import { adminDb } from "@/lib/firebase-admin";
import { FAD_WORKSPACES_COLLECTION } from "./firestore-paths";
import { executeMonitoringRun, listMonitoringRules } from "./monitoring-service";
import type { FadMonitoringFrequency, FadMonitoringRule } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const FREQUENCY_DAYS: Record<Exclude<FadMonitoringFrequency, "manual">, number> = {
  monthly: 30,
  bimonthly: 60,
  quarterly: 90,
  semiannual: 180,
  annual: 365,
};

export function isMonitoringRuleDue(rule: FadMonitoringRule, now = Date.now()): boolean {
  if (!rule.enabled || rule.frequency === "manual") return false;
  if (!rule.lastRunAt) return true;
  const days = FREQUENCY_DAYS[rule.frequency];
  const elapsed = now - new Date(rule.lastRunAt).getTime();
  return elapsed >= days * DAY_MS;
}

export type ScheduledMonitoringResult = {
  workspacesScanned: number;
  rulesDue: number;
  executed: number;
  skipped: number;
  errors: Array<{ workspaceId: string; ruleId: string; message: string }>;
};

export async function runScheduledMonitoringJobs(): Promise<ScheduledMonitoringResult> {
  const workspacesSnap = await adminDb().collection(FAD_WORKSPACES_COLLECTION).get();
  const result: ScheduledMonitoringResult = {
    workspacesScanned: workspacesSnap.size,
    rulesDue: 0,
    executed: 0,
    skipped: 0,
    errors: [],
  };

  for (const wsDoc of workspacesSnap.docs) {
    const workspaceId = wsDoc.id;
    const ownerId = (wsDoc.data().ownerId as string) ?? "";
    if (!ownerId) {
      result.skipped += 1;
      continue;
    }

    const rules = await listMonitoringRules(workspaceId);
    const due = rules.filter((r) => isMonitoringRuleDue(r));

    for (const rule of due) {
      result.rulesDue += 1;
      try {
        await executeMonitoringRun({ workspaceId, ruleId: rule.id, ownerId });
        result.executed += 1;
      } catch (e) {
        result.errors.push({
          workspaceId,
          ruleId: rule.id,
          message: e instanceof Error ? e.message : "Falha no monitoramento",
        });
      }
    }
  }

  return result;
}
