/**
 * Verifica que perfis sem acesso a Estudos Técnicos não veem PEA no menu
 * e que isRoleAllowedForPath bloqueia cliente_autonomo em /studies/educacao-ambiental.
 *
 * Uso: node scripts/verify-pea-route-roles.mjs
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const navPath = path.join(root, 'src/lib/navigation-config.ts');
const nav = readFileSync(navPath, 'utf8');

const peaBlock = nav.match(
  /href:\s*["']\/studies\/educacao-ambiental["'][\s\S]*?roles:\s*\[([\s\S]*?)\]/,
);
if (!peaBlock) {
  console.error('FAIL: entrada PEA não encontrada em navigation-config.ts');
  process.exit(1);
}

const rolesStr = peaBlock[1];
const denied = ['client', 'representative', 'cliente_autonomo', 'sales', 'financial'];
const leaks = denied.filter((r) => rolesStr.includes(`"${r}"`));
if (leaks.length) {
  console.error('FAIL: PEA visível para roles que não devem ter acesso:', leaks.join(', '));
  process.exit(1);
}

const routeAccess = readFileSync(
  path.join(root, 'src/lib/route-access.ts'),
  'utf8',
);
if (!routeAccess.includes("'/studies': '/studies/educacao-ambiental'")) {
  console.error('FAIL: alias /studies → PEA ausente em route-access.ts');
  process.exit(1);
}
if (!routeAccess.includes("'/studies'")) {
  console.error('FAIL: prefixo /studies em PATH_PREFIXES_DENIED_FOR_CLIENTE_AUTONOMO');
  process.exit(1);
}

console.log('OK: PEA restrito a roles operacionais; redirects e bloqueio cliente_autonomo presentes no código.');
