"use server";

import { analyseArea } from "@/ai/flows/analise-ambiental-flow";
import {
  assertCanRunAmbbot,
  recordAmbbotUsage,
  verifyIdTokenAndLoadUser,
} from "@/lib/package-enforcement-server";
import {
  isPackageLimitsExempt,
  isSubjectToPackageLimits,
} from "@/lib/package-limits";
import type {
  AnaliseAmbientalInput,
  AnaliseAmbientalOutput,
} from "@/lib/types/analise-ambiental";

type AnalyseAreaActionResult =
  | { success: true; result: AnaliseAmbientalOutput }
  | { success: false; error: string };

export async function handleAnalyseArea(
  input: AnaliseAmbientalInput,
  idToken?: string | null,
): Promise<AnalyseAreaActionResult> {
  try {
    let usedIncluded = false;
    if (idToken) {
      const user = await verifyIdTokenAndLoadUser(idToken);
      if (isSubjectToPackageLimits(user) && !isPackageLimitsExempt(user)) {
        const gate = await assertCanRunAmbbot(user);
        usedIncluded = gate.usedIncluded;
      }
    }

    const result = await analyseArea(input);

    if (idToken) {
      try {
        const user = await verifyIdTokenAndLoadUser(idToken);
        if (isSubjectToPackageLimits(user) && !isPackageLimitsExempt(user)) {
          await recordAmbbotUsage(user.uid || user.id, usedIncluded);
        }
      } catch (recordErr) {
        console.warn("ambbot usage record failed:", recordErr);
      }
    }

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível processar a análise geoespacial.",
    };
  }
}
