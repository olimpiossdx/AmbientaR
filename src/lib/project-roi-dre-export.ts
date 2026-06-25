import type { ProjectRoiCase } from '@/lib/types';
import type { ProjectRoiSnapshot } from '@/lib/project-roi-aggregator';
import {
  buildProjectRoiDreCsv as buildProjectRoiExportCsv,
  downloadProjectRoiDreCsv as downloadProjectRoiExportCsv,
  formatDreLineValue,
  type ProjectRoiExportInput,
} from '@/lib/project-roi-export';

export { formatDreLineValue };

function legacyInput(
  roiCase: ProjectRoiCase,
  snap: ProjectRoiSnapshot,
  title: string,
): ProjectRoiExportInput {
  return {
    roiCase,
    snap,
    title,
    supplierSummary: { totalPaid: snap.pago, groups: [] },
  };
}

export function buildProjectRoiDreCsv(
  roiCase: ProjectRoiCase,
  snap: ProjectRoiSnapshot,
  title: string,
): string {
  return buildProjectRoiExportCsv(legacyInput(roiCase, snap, title));
}

export function downloadProjectRoiDreCsv(
  roiCase: ProjectRoiCase,
  snap: ProjectRoiSnapshot,
  title: string,
): void {
  downloadProjectRoiExportCsv(legacyInput(roiCase, snap, title));
}
