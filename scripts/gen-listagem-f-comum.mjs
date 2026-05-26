import fs from 'fs';
import path from 'path';

const dir = path.join('e:/A/src/app/(app)/projects');
let c = fs.readFileSync(path.join(dir, 'form-listagem-c-comum.tsx'), 'utf8');

c = c.replaceAll('listagemC', 'listagemF');
c = c.replaceAll('FormListagemC', 'FormListagemF');
c = c.replace(
  "import { FormListagemFEspecifico } from './form-listagem-f-especifico';\nimport { FormListagemFSecao6 } from './form-listagem-f-secao6';",
  "import { FormListagemFEspecifico } from './form-listagem-f-especifico';\nimport { FormListagemFEmpreendedor } from './form-listagem-f-empreendedor';\nimport { FormListagemFSecao6 } from './form-listagem-f-secao6';\nimport { FormListagemFAgendas } from './form-listagem-f-agendas';",
);
c = c.replace(
  /return \(\s*<div className="space-y-6">/,
  'return (\n    <div className="space-y-6">\n      <FormListagemFEmpreendedor form={form} />',
);
c = c.replace(
  /<FormListagemFSecao6 form=\{form\} \/>\s*/,
  '',
);
c = c.replace(
  /(<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">7\. Outras)/,
  '<FormListagemFSecao6 form={form} />\n\n      $1',
);
c = c.replace(
  /(<\/div>\s*\n\s*)(<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">9\. Restrições)/,
  '$1<FormListagemFAgendas form={form} />\n\n      $2',
);
// Remove sections 9-16 from comum (moved to especifico)
c = c.replace(
  /\s*<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">9\. Restrições Locacionais[\s\S]*?<FormListagemFEspecifico form=\{form\} \/>/,
  '\n      <FormListagemFEspecifico form={form} />',
);
c = c.replace(/export function FormListagemF\(/, 'export function FormListagemFPostoCombustivel(');

fs.writeFileSync(path.join(dir, 'form-listagem-f-comum.tsx'), c);
console.log('OK');
