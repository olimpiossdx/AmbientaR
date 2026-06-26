/**
 * Pré-gera/atualiza cache de schemas de formulário (.form-schema-cache.json)
 * para RCA, PCA, EIA-RIMA, LAS-RAS e REANALISE.
 *
 * Uso:
 *   npm run tr:sync-forms
 *   npm run tr:sync-forms -- --dry-run
 *   ONLY=rca,pca npm run tr:sync-forms
 *
 * Variáveis:
 *   TERMOS_REFERENCIA_DIR  Pasta base (padrão: ./termos de referencia)
 *   ONLY                   Slugs separados por vírgula (rca,pca,...)
 */

import { syncAllStudyFormSchemaCaches } from '../src/lib/study-form-schema-sync';

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const onlyEnv = process.env.ONLY?.split(',').map((s) => s.trim()).filter(Boolean);
  const onlyFlag = argv.find((a) => a.startsWith('--only='));
  const only = onlyFlag
    ? onlyFlag
        .replace('--only=', '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : onlyEnv;

  console.log('Sincronizando schemas de formulário (termos de referência)…');
  if (dryRun) console.log('Modo DRY_RUN — nenhum arquivo será gravado.\n');

  const report = await syncAllStudyFormSchemaCaches({
    dryRun,
    refresh: true,
    only,
  });

  console.log('Base:', report.basePath);
  console.log(
    `Resumo: ${report.summary.ok} ok | ${report.summary.skipped} ignorados | ${report.summary.error} erros\n`,
  );

  for (const item of report.items) {
    const act = item.activity ? ` | ${item.activity.slice(0, 40)}…` : '';
    const sub = item.subactivity ? ` > ${item.subactivity.slice(0, 30)}…` : '';
    const detail =
      item.status === 'ok'
        ? `${item.file} (${item.source})`
        : item.message ?? '';
    console.log(`[${item.status}] ${item.studySlug}${act}${sub} — ${detail}`);
  }

  if (report.summary.error > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
