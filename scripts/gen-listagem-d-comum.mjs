import fs from 'fs';
import path from 'path';

const dir = path.join('e:/A/src/app/(app)/projects');
let c = fs.readFileSync(path.join(dir, 'form-listagem-c-comum.tsx'), 'utf8');

c = c.replaceAll('listagemC', 'listagemD');
c = c.replaceAll('FormListagemC', 'FormListagemD');
c = c.replace(
  "import { FormListagemCEspecifico } from './form-listagem-c-especifico';\nimport { FormListagemCSecao6 } from './form-listagem-c-secao6';",
  "import { FormListagemDEspecifico } from './form-listagem-d-especifico';\nimport { FormListagemDEmpreendedor } from './form-listagem-d-empreendedor';\nimport { FormListagemDSecao6 } from './form-listagem-d-secao6';\nimport { FormListagemDAgendas } from './form-listagem-d-agendas';",
);
c = c.replaceAll('FormListagemCEspecifico', 'FormListagemDEspecifico');
c = c.replaceAll('FormListagemCSecao6', 'FormListagemDSecao6');

c = c.replace(
  /\s*<FormListagemDSecao6 form=\{form\} \/>\s*/,
  '\n      <FormListagemDEmpreendedor form={form} />\n      <FormListagemDSecao6 form={form} />\n      <FormListagemDAgendas form={form} />\n',
);

// Remove seção 6 borracha (substituída por aguardente)
c = c.replace(/<FormListagemDSecao6 form=\{form\} \/>\s*/, '');

// Re-inject secao6 after item 5 - find "7. Outras" and insert before it
c = c.replace(
  /(<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">7\. Outras)/,
  '<FormListagemDSecao6 form={form} />\n\n      $1',
);

fs.writeFileSync(path.join(dir, 'form-listagem-d-comum.tsx'), c);
console.log('OK');
