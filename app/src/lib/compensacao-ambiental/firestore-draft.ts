import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { CompensacaoTipo } from "./config";
import type { CompensacaoProcessoDraft } from "./storage";

export function compensacaoDraftDocId(uid: string, tipo: CompensacaoTipo): string {
  return `${uid}_${tipo}`;
}

function draftFromFirestoreData(
  data: Record<string, unknown>,
): CompensacaoProcessoDraft {
  const checkedIds = Array.isArray(data.checkedIds)
    ? (data.checkedIds as string[])
    : [];
  const templateFiles =
    data.templateFiles && typeof data.templateFiles === "object"
      ? (data.templateFiles as Record<string, string>)
      : {};
  return {
    titulo: typeof data.titulo === "string" ? data.titulo : "",
    empreendimento: typeof data.empreendimento === "string" ? data.empreendimento : "",
    seiLicenca: typeof data.seiLicenca === "string" ? data.seiLicenca : "",
    seiCompensacao: typeof data.seiCompensacao === "string" ? data.seiCompensacao : "",
    condicionante: typeof data.condicionante === "string" ? data.condicionante : "",
    snucRamoVr:
      typeof data.snucRamoVr === "string" ? data.snucRamoVr : undefined,
    checkedIds,
    templateFiles,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
  };
}

export async function loadCompensacaoDraftFromFirestore(
  firestore: Firestore,
  uid: string,
  tipo: CompensacaoTipo,
): Promise<CompensacaoProcessoDraft | null> {
  const snap = await getDoc(
    doc(firestore, "compensacao_drafts", compensacaoDraftDocId(uid, tipo)),
  );
  if (!snap.exists()) return null;
  return draftFromFirestoreData(snap.data() as Record<string, unknown>);
}

export async function saveCompensacaoDraftToFirestore(
  firestore: Firestore,
  uid: string,
  tipo: CompensacaoTipo,
  draft: CompensacaoProcessoDraft,
): Promise<void> {
  await setDoc(
    doc(firestore, "compensacao_drafts", compensacaoDraftDocId(uid, tipo)),
    {
      tipo,
      createdBy: uid,
      titulo: draft.titulo,
      empreendimento: draft.empreendimento,
      seiLicenca: draft.seiLicenca,
      seiCompensacao: draft.seiCompensacao,
      condicionante: draft.condicionante,
      snucRamoVr: draft.snucRamoVr ?? null,
      checkedIds: draft.checkedIds,
      templateFiles: draft.templateFiles,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
