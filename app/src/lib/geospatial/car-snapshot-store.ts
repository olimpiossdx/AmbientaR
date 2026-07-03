import {
  addDoc,
  collection,
  type Firestore,
  limit,
  orderBy,
  query,
  getDocs,
} from "firebase/firestore";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";

export type CarSnapshotRecord = {
  codImovel: string;
  areaHa: number;
  municipio?: string;
  uf?: string;
  statusImovel?: string;
  condicao?: string;
  dataAtualizacaoSicar?: string;
  perimetroFonte: string;
  confianca: string;
  metodoEntrada: string;
  polygonGeojson: object;
  geometryFingerprint: string;
  /** layerIds Wave A com sobreposição na execução (para comparar omissões). */
  riscoCamadas?: string[];
  capturedAtUtc: string;
  source: string;
  createdBy: string;
};

function geometryFingerprint(geo: object): string {
  const s = JSON.stringify(geo);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `${(h >>> 0).toString(16)}-${s.length}`;
}

export function buildCarSnapshotRecord(
  resolved: LocalizacaoResolvida,
  opts: { source: string; createdBy: string; riscoCamadas?: string[] },
): CarSnapshotRecord | null {
  const cod =
    resolved.imovelSelecionadoCod ?? resolved.imoveis[0]?.codImovel ?? "";
  if (!cod || resolved.status !== "ok") return null;
  const imovel =
    resolved.imoveis.find((i) => i.codImovel === cod) ?? resolved.imoveis[0];
  return {
    codImovel: cod,
    areaHa: resolved.areaHa,
    municipio: imovel?.municipio,
    uf: imovel?.uf,
    statusImovel: imovel?.statusLabel ?? imovel?.situacao,
    condicao: imovel?.condicao,
    dataAtualizacaoSicar: imovel?.dataAtualizacao,
    perimetroFonte: resolved.perimetroFonte,
    confianca: resolved.confianca,
    metodoEntrada: resolved.metodoEntrada,
    polygonGeojson: resolved.perimetroFinal,
    geometryFingerprint: geometryFingerprint(resolved.perimetroFinal),
    riscoCamadas: opts.riscoCamadas?.length ? opts.riscoCamadas : undefined,
    capturedAtUtc: new Date().toISOString(),
    source: opts.source,
    createdBy: opts.createdBy,
  };
}

/** Persiste snapshot SICAR para histórico AmbientaR (WFS não expõe versões). */
export async function saveCarSnapshot(
  firestore: Firestore,
  resolved: LocalizacaoResolvida,
  opts: { source: string; createdBy: string; riscoCamadas?: string[] },
): Promise<string | null> {
  const record = buildCarSnapshotRecord(resolved, opts);
  if (!record) return null;
  const ref = await addDoc(
    collection(firestore, "car_snapshots", record.codImovel, "records"),
    record,
  );
  return ref.id;
}

export async function fetchCarSnapshotHistory(
  firestore: Firestore,
  codImovel: string,
  maxRecords = 10,
): Promise<(CarSnapshotRecord & { id: string })[]> {
  const q = query(
    collection(firestore, "car_snapshots", codImovel, "records"),
    orderBy("capturedAtUtc", "desc"),
    limit(maxRecords),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as CarSnapshotRecord),
  }));
}
