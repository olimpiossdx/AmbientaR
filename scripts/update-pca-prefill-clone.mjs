import fs from 'fs';
import path from 'path';

const configs = [
  ['C', 'listagemC'],
  ['D', 'listagemD'],
  ['E', 'listagemE'],
  ['F', 'listagemF'],
  ['G', 'listagemG'],
  ['H', 'listagemH'],
];

for (const [L, key] of configs) {
  const p = path.join(
    process.cwd(),
    `src/app/(app)/studies/pca/listagem-${L.toLowerCase()}/pca-project-prefill.ts`,
  );
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('cloneProjectListagemBlock')) {
    c = c.replace(
      /from '\.\.\/lib\/pca-prefill-shared';/,
      "from '../lib/pca-prefill-shared';\n// clone import added below",
    );
    c = c.replace(
      "shouldPrefillPcaFromProject,\n} from '../lib/pca-prefill-shared';",
      "shouldPrefillPcaFromProject,\n  cloneProjectListagemBlock,\n} from '../lib/pca-prefill-shared';",
    );
    c = c.replace(
      "shouldPrefillPcaFromProject,\n} from '../lib/pca-prefill-shared';\n// clone import added below",
      "shouldPrefillPcaFromProject,\n  cloneProjectListagemBlock,\n} from '../lib/pca-prefill-shared';",
    );
  }
  c = c.replace(new RegExp(`function mapProjectListagem${L}ToPca\\([\\s\\S]*?\\n\\}\\r?\\n\\r?\\n`), '');
  c = c.replace(
    new RegExp(`${key}: mapProjectListagem${L}ToPca\\([\\s\\S]*?\\),`),
    `${key}: cloneProjectListagemBlock(projectRecord, '${key}'),`,
  );
  fs.writeFileSync(p, c);
  console.log('Updated', p);
}
