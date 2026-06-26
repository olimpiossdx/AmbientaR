/**
 * Verificação do módulo Projetos e Segurança de Barragens (pós-implementação SIEBB).
 * Uso: npm run barragem:module-check
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function fail(msg) {
  console.error(`[barragem-module-verify] ERRO: ${msg}`);
  process.exit(1);
}

function assertFile(rel) {
  const full = path.join(root, rel);
  if (!existsSync(full)) fail(`Ficheiro em falta: ${rel}`);
}

const REQUIRED_FILES = [
  'src/lib/barragem/calculos/index.ts',
  'src/lib/barragem/calculos/morgenstern-price.ts',
  'src/lib/barragem/calculos/gravity-dam-stability.ts',
  'src/lib/seguranca-barragens/hec-ras-export.ts',
  'src/lib/seguranca-barragens/hec-ras-import.ts',
  'src/lib/piscinao-off-stream/export-placeholders.ts',
  'src/app/(app)/studies/barragens/page.tsx',
  'src/components/barragem/barragem-geotecnia-panel.tsx',
  'src/components/seguranca-barragens/seguranca-hec-ras-import-panel.tsx',
  'docs/PLACEHOLDERS-DOCX.md',
];

for (const f of REQUIRED_FILES) assertFile(f);

const slugsTs = readFileSync(path.join(root, 'src/lib/docx-template-slugs.ts'), 'utf8');
for (const slug of ['barragens', 'seguranca-barragens', 'piscinao-off-stream']) {
  if (!slugsTs.includes(`"${slug}"`)) fail(`Slug DOCX em falta: ${slug}`);
}

const templateConfig = readFileSync(
  path.join(root, 'src/app/(app)/settings/templates/template-config.ts'),
  'utf8',
);
for (const slug of ['barragens', 'seguranca-barragens', 'piscinao-off-stream']) {
  if (!templateConfig.includes(`slug: '${slug}'`)) {
    fail(`template-config.ts sem card: ${slug}`);
  }
}

const firestoreRules = readFileSync(path.join(root, 'src/firebase/rules/firestore.rules'), 'utf8');
for (const col of ['projetosTecnicosBarragem', 'estudosSegurancaBarragem', 'piscinoesOffStream']) {
  if (!firestoreRules.includes(col)) fail(`Regra Firestore em falta: ${col}`);
}

const nav = readFileSync(path.join(root, 'src/lib/navigation-config.ts'), 'utf8');
if (!nav.includes('/studies/barragens')) fail('Hub /studies/barragens ausente do menu');

console.log('[barragem-module-verify] Estrutura OK — a correr barragem:calculos-check…');

const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const calc = spawnSync(process.execPath, [tsx, 'scripts/barragem-calculos-verify.ts'], {
  cwd: root,
  stdio: 'inherit',
});
if (calc.status !== 0) fail('barragem:calculos-check falhou');

console.log('[barragem-module-verify] OK — módulo barragens verificado.');
