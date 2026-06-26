import { access } from 'fs/promises';
import type { StudyTypeKey } from '@/lib/study-form-resolution-catalog';
import {
  extractListagemCode,
  LISTAGEM_ACTIVITY_BY_CODE,
  LISTAGEM_CODES,
} from '@/lib/listagem-activities';
import {
  RCA_LISTAGEM_ACTIVITIES,
  RCA_SUBACTIVITIES,
} from '@/lib/rca-listagem-catalog';
import { resolveRcaTermosReferenciaPath } from '@/lib/rca/rca-termos-referencia-paths';
import { getTermosReferenciaPathForStudy } from '@/lib/termos-referencia-paths';
import { resolveAndCacheStudyFormSchema } from '@/lib/study-form-schema-cache';

export const BATCH_FORM_SCHEMA_STUDIES: StudyTypeKey[] = [
  'rca',
  'pca',
  'eia-rima',
  'las-ras',
  'reanalise',
];

export type SyncFormSchemaJobOptions = {
  dryRun?: boolean;
  refresh?: boolean;
  only?: string[];
};

export type SyncFormSchemaJobItem = {
  studySlug: string;
  activity: string | null;
  subactivity: string | null;
  status: 'ok' | 'skipped' | 'error';
  source?: 'cache' | 'docx';
  file?: string;
  message?: string;
};

export type SyncFormSchemaJobReport = {
  basePath: string;
  dryRun: boolean;
  items: SyncFormSchemaJobItem[];
  summary: {
    ok: number;
    skipped: number;
    error: number;
  };
};

function buildSyncTargets(studySlug: string): Array<{
  activity: string | null;
  subactivity: string | null;
}> {
  const targets: Array<{ activity: string | null; subactivity: string | null }> = [
    { activity: null, subactivity: null },
  ];

  for (const code of LISTAGEM_CODES) {
    targets.push({
      activity: LISTAGEM_ACTIVITY_BY_CODE[code],
      subactivity: null,
    });
  }

  if (studySlug === 'rca') {
    for (const activity of RCA_LISTAGEM_ACTIVITIES) {
      const subs = RCA_SUBACTIVITIES[activity] ?? [];
      if (subs.length === 0) {
        targets.push({ activity, subactivity: null });
        continue;
      }
      for (const sub of subs) {
        targets.push({ activity, subactivity: sub });
      }
    }
  }

  return targets;
}

export async function syncAllStudyFormSchemaCaches(
  options: SyncFormSchemaJobOptions = {},
): Promise<SyncFormSchemaJobReport> {
  const dryRun = options.dryRun ?? false;
  const refresh = options.refresh ?? true;
  const onlySet = options.only?.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const studies = onlySet?.length
    ? BATCH_FORM_SCHEMA_STUDIES.filter((s) => onlySet.includes(s))
    : BATCH_FORM_SCHEMA_STUDIES;

  const items: SyncFormSchemaJobItem[] = [];

  for (const studySlug of studies) {
    const dirPath = getTermosReferenciaPathForStudy(studySlug);
    if (!dirPath) {
      items.push({
        studySlug,
        activity: null,
        subactivity: null,
        status: 'error',
        message: 'Estudo sem pasta TR configurada.',
      });
      continue;
    }

    if (studySlug !== 'rca') {
      try {
        await access(dirPath);
      } catch {
        items.push({
          studySlug,
          activity: null,
          subactivity: null,
          status: 'skipped',
          message: `Pasta TR não encontrada: ${dirPath}`,
        });
        continue;
      }
    }

    const targets = buildSyncTargets(studySlug);
    for (const target of targets) {
      let targetDirPath = dirPath;
      if (studySlug === 'rca' && target.activity) {
        const listagemCode = extractListagemCode(target.activity);
        if (listagemCode) {
          const rcaPath = await resolveRcaTermosReferenciaPath(listagemCode);
          if (rcaPath) targetDirPath = rcaPath;
        }
      }

      try {
        const result = await resolveAndCacheStudyFormSchema({
          studySlug,
          dirPath: targetDirPath,
          activity: target.activity,
          subactivity: target.subactivity,
          refresh,
          dryRun,
        });
        if (!result.ok) {
          items.push({
            studySlug,
            activity: target.activity,
            subactivity: target.subactivity,
            status: 'skipped',
            message: result.reason,
          });
          continue;
        }
        items.push({
          studySlug,
          activity: target.activity,
          subactivity: target.subactivity,
          status: 'ok',
          source: result.source,
          file: result.matchedBy.file,
        });
      } catch (e) {
        items.push({
          studySlug,
          activity: target.activity,
          subactivity: target.subactivity,
          status: 'error',
          message: e instanceof Error ? e.message : 'Erro desconhecido.',
        });
      }
    }
  }

  const summary = {
    ok: items.filter((i) => i.status === 'ok').length,
    skipped: items.filter((i) => i.status === 'skipped').length,
    error: items.filter((i) => i.status === 'error').length,
  };

  const basePath =
    process.env.TERMOS_REFERENCIA_DIR?.trim() ||
    '(padrão: termos de referencia na raiz do projeto)';

  return { basePath, dryRun, items, summary };
}
