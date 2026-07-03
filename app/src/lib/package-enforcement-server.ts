"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  buildLimitErrorMessage,
  getAmbbotUsagePeriodKey,
  getPackageLimits,
  resolveEffectivePackage,
  isPackageLimitsExempt,
  isSubjectToPackageLimits,
  PORTAL_MODULE_COLLECTIONS,
  PORTAL_MODULE_LABELS,
  type PackageLimitCheckCode,
  type PackageLimits,
  type PortalModuleCollection,
} from "@/lib/package-limits";
import type { AppUser } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

export type PackageUsageSnapshot = {
  empreendimentos: number;
  limits: PackageLimits;
  package: ReturnType<typeof resolveEffectivePackage>;
  ambbotIncludedPerMonth: number;
  ambbotIncludedRemaining: number;
  ambbotPrepaidCredits: number;
  ambbotPeriod: string;
};

async function loadUserDoc(uid: string): Promise<AppUser | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return { id: snap.id, uid, ...data } as AppUser;
}

async function collectEmpreendedorIds(
  user: AppUser,
): Promise<string[]> {
  const db = adminDb();
  const ids = new Set<string>();

  if (user.linkedEmpreendedorId) {
    ids.add(user.linkedEmpreendedorId);
  }

  const docs = [
    user.cpf,
    user.userCpf,
    ...(user.cnpjs || []),
  ].filter(Boolean) as string[];

  if (docs.length === 0) return [...ids];

  const chunks: string[][] = [];
  for (let i = 0; i < docs.length; i += 10) {
    chunks.push(docs.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const snap = await db
      .collection("empreendedores")
      .where("cpfCnpj", "in", chunk)
      .get();
    snap.docs.forEach((d) => ids.add(d.id));
  }

  const byUser = await db
    .collection("empreendedores")
    .where("userId", "==", user.uid || user.id)
    .get();
  byUser.docs.forEach((d) => ids.add(d.id));

  return [...ids];
}

/** Conta empreendimentos vinculados ao titular/autônomo. */
export async function countPortalUserProjects(uid: string): Promise<number> {
  const user = await loadUserDoc(uid);
  if (!user) return 0;

  const db = adminDb();
  const projectIds = new Set<string>();

  const byUserId = await db
    .collection("projects")
    .where("userId", "==", uid)
    .get();
  byUserId.docs.forEach((d) => projectIds.add(d.id));

  const empreendedorIds = await collectEmpreendedorIds(user);
  for (let i = 0; i < empreendedorIds.length; i += 10) {
    const chunk = empreendedorIds.slice(i, i + 10);
    if (chunk.length === 0) continue;
    const snap = await db
      .collection("projects")
      .where("empreendedorId", "in", chunk)
      .get();
    snap.docs.forEach((d) => projectIds.add(d.id));
  }

  return projectIds.size;
}

function readAmbbotState(user: AppUser, limits: PackageLimits) {
  const period = getAmbbotUsagePeriodKey();
  const storedPeriod = user.ambbotUsagePeriod;
  const used =
    storedPeriod === period ? (user.ambbotIncludedUsed ?? 0) : 0;
  const prepaid = user.ambbotPrepaidCredits ?? 0;
  const includedRemaining = Math.max(0, limits.ambbotIncludedPerMonth - used);

  return { period, used, prepaid, includedRemaining };
}

export async function getPackageUsageForUid(
  uid: string,
): Promise<PackageUsageSnapshot | null> {
  const user = await loadUserDoc(uid);
  if (!user) return null;

  const pkg = resolveEffectivePackage(user);
  const limits = getPackageLimits(user);
  const empreendimentos = await countPortalUserProjects(uid);
  const ambbot = readAmbbotState(user, limits);

  return {
    empreendimentos,
    limits,
    package: pkg,
    ambbotIncludedPerMonth: limits.ambbotIncludedPerMonth,
    ambbotIncludedRemaining: ambbot.includedRemaining,
    ambbotPrepaidCredits: ambbot.prepaid,
    ambbotPeriod: ambbot.period,
  };
}

export async function verifyIdTokenAndLoadUser(
  idToken: string | null | undefined,
): Promise<AppUser> {
  if (!idToken?.trim()) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }
  const decoded = await adminAuth().verifyIdToken(idToken.trim());
  const user = await loadUserDoc(decoded.uid);
  if (!user) {
    throw new Error("Perfil de usuário não encontrado.");
  }
  return user;
}

/** Conta registos num módulo vinculado aos empreendedores do titular/autônomo. */
export async function countPortalModuleRecords(
  uid: string,
  collectionName: PortalModuleCollection,
): Promise<number> {
  const user = await loadUserDoc(uid);
  if (!user) return 0;

  const empreendedorIds = await collectEmpreendedorIds(user);
  const db = adminDb();
  const ids = new Set<string>();

  if (empreendedorIds.length === 0) return 0;

  for (let i = 0; i < empreendedorIds.length; i += 10) {
    const chunk = empreendedorIds.slice(i, i + 10);
    const snap = await db
      .collection(collectionName)
      .where("empreendedorId", "in", chunk)
      .get();
    snap.docs.forEach((d) => ids.add(d.id));
  }

  return ids.size;
}

export async function assertCanCreatePortalModuleRecord(
  user: AppUser,
  collectionName: PortalModuleCollection,
): Promise<void> {
  if (!isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) return;

  const limits = getPackageLimits(user);
  if (limits.maxRecordsPerModule == null) return;

  const count = await countPortalModuleRecords(
    user.uid || user.id,
    collectionName,
  );
  if (count >= limits.maxRecordsPerModule) {
    const label = PORTAL_MODULE_LABELS[collectionName] ?? collectionName;
    throw new Error(
      `No plano gratuito é permitido apenas ${limits.maxRecordsPerModule} ${label}. Faça upgrade para cadastrar mais.`,
    );
  }
}

export async function assertCanCreateEmpreendimento(
  user: AppUser,
  currentCount?: number,
): Promise<void> {
  if (!isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) return;

  const limits = getPackageLimits(user);
  const count =
    currentCount ?? (await countPortalUserProjects(user.uid || user.id));

  if (count >= limits.maxEmpreendimentos) {
    throw new Error(
      buildLimitErrorMessage("empreendimento_limit", limits),
    );
  }
}

export async function assertCanRunAmbbot(
  user: AppUser,
): Promise<{ usedIncluded: boolean }> {
  if (!isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) {
    return { usedIncluded: false };
  }

  const limits = getPackageLimits(user);
  const { period, used, prepaid, includedRemaining } = readAmbbotState(
    user,
    limits,
  );

  if (includedRemaining > 0) {
    return { usedIncluded: true };
  }
  if (prepaid > 0) {
    return { usedIncluded: false };
  }

  throw new Error(buildLimitErrorMessage("ambbot_no_credit", limits));
}

/** Regista consumo após análise concluída com sucesso. */
export async function recordAmbbotUsage(
  uid: string,
  usedIncluded: boolean,
): Promise<void> {
  const user = await loadUserDoc(uid);
  if (!user || !isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) {
    return;
  }

  const period = getAmbbotUsagePeriodKey();
  const ref = adminDb().collection("users").doc(uid);

  if (usedIncluded) {
    const prevPeriod = user.ambbotUsagePeriod;
    const prevUsed =
      prevPeriod === period ? (user.ambbotIncludedUsed ?? 0) : 0;
    await ref.update({
      ambbotUsagePeriod: period,
      ambbotIncludedUsed: prevUsed + 1,
    });
    return;
  }

  const prepaid = user.ambbotPrepaidCredits ?? 0;
  if (prepaid <= 0) return;

  await ref.update({
    ambbotPrepaidCredits: FieldValue.increment(-1),
    ambbotUsagePeriod: period,
  });
}

export async function checkPackageLimitForToken(
  idToken: string | null | undefined,
  action: "create_empreendimento" | "ambbot" | `create_module:${PortalModuleCollection}`,
): Promise<{ ok: true } | { ok: false; code: PackageLimitCheckCode; message: string }> {
  try {
    const user = await verifyIdTokenAndLoadUser(idToken);
    if (!isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) {
      return { ok: true };
    }
    const limits = getPackageLimits(user);

    if (action === "create_empreendimento") {
      const count = await countPortalUserProjects(user.uid || user.id);
      if (count >= limits.maxEmpreendimentos) {
        return {
          ok: false,
          code: "empreendimento_limit",
          message: buildLimitErrorMessage("empreendimento_limit", limits),
        };
      }
      return { ok: true };
    }

    if (action.startsWith("create_module:")) {
      const collectionName = action.replace(
        "create_module:",
        "",
      ) as PortalModuleCollection;
      if (!PORTAL_MODULE_COLLECTIONS.includes(collectionName)) {
        return { ok: true };
      }
      try {
        await assertCanCreatePortalModuleRecord(user, collectionName);
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          code: "module_record_limit",
          message:
            e instanceof Error
              ? e.message
              : buildLimitErrorMessage("module_record_limit", limits),
        };
      }
    }

    try {
      await assertCanRunAmbbot(user);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        code: "ambbot_no_credit",
        message:
          e instanceof Error
            ? e.message
            : buildLimitErrorMessage("ambbot_no_credit", limits),
      };
    }
  } catch (e) {
    return {
      ok: false,
      code: "ambbot_no_credit",
      message: e instanceof Error ? e.message : "Não autorizado.",
    };
  }
}
