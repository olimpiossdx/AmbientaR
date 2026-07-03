import fs from 'fs';
import path from 'path';

const dir = path.join('e:/A/src/app/(app)/projects');
let c = fs.readFileSync(path.join(dir, 'form-listagem-c-comum.tsx'), 'utf8');

c = c.replaceAll('listagemC', 'listagemE');
c = c.replaceAll('FormListagemC', 'FormListagemE');
c = c.replace(
  "import { FormListagemEEspecifico } from './form-listagem-e-especifico';\nimport { FormListagemESecao6 } from './form-listagem-e-secao6';",
  "import { FormListagemEEspecifico } from './form-listagem-e-especifico';\nimport { FormListagemEEmpreendedor } from './form-listagem-e-empreendedor';\nimport { FormListagemEGeoTrecho } from './form-listagem-e-geo-trecho';\nimport { FormListagemESecao6 } from './form-listagem-e-secao6';",
);
c = c.replace(
  /return \(\s*<div className="space-y-6">/,
  'return (\n    <div className="space-y-6">\n      <FormListagemEEmpreendedor form={form} />',
);
c = c.replace(
  /<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">5\. Localização Geográfica<\/h3>[\s\S]*?<\/div>\s*\n\s*<FormListagemESecao6/,
  '<FormListagemEGeoTrecho form={form} />\n\n      <FormListagemESecao6',
);

fs.writeFileSync(path.join(dir, 'form-listagem-e-comum.tsx'), c);
console.log('OK');
