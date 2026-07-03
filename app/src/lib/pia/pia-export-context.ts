import type { PiaInventorySnapshot } from '@/lib/pia/pia-inventory-snapshot';
import type { PiaRecord } from '@/lib/pia/pia-record';
import { buildPiaExportSections, type PiaExportSection } from '@/lib/pia/pia-export-manifest';

export type PiaExportBuildInput = {
  record: PiaRecord;
  inventory?: PiaInventorySnapshot | null;
};

export function buildPiaExportBundle(input: PiaExportBuildInput): {
  sections: PiaExportSection[];
  sectionManifest: string[];
  inventory: PiaInventorySnapshot | null;
} {
  const sections = buildPiaExportSections(input.record, input.inventory ?? null);
  return {
    sections,
    sectionManifest: sections.map((s) => s.title),
    inventory: input.inventory ?? null,
  };
}
