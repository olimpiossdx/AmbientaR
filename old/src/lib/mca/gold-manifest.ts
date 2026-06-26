import fs from "node:fs";
import path from "node:path";
import type { McaGoldPresetId } from "./gold-presets";

export type GoldManifestExpected = {
  pivoCountMin?: number;
  appPolygonCountMin?: number;
  rlGlebaCountMin?: number;
  rlCompensadaFlags?: boolean;
  confrontantesNamed?: boolean;
};

export type GoldManifest = {
  id: McaGoldPresetId;
  propertyName?: string;
  ownerName?: string;
  municipality?: string;
  areaTotalHa: number;
  scale?: string;
  matriculas?: string[];
  expected?: GoldManifestExpected;
  visualChecklist?: string[];
  notes?: string;
};

export function loadGoldManifest(id: McaGoldPresetId): GoldManifest | null {
  try {
    const filePath = path.join(process.cwd(), "docs/mca/gold", id, "manifest.json");
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as GoldManifest;
    if (!raw?.id || typeof raw.areaTotalHa !== "number") return null;
    return raw;
  } catch {
    return null;
  }
}

export function goldManifestAreaHa(id: McaGoldPresetId): number | null {
  return loadGoldManifest(id)?.areaTotalHa ?? null;
}
