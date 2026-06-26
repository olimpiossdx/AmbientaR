import fs from 'fs';
import path from 'path';

const dir = path.join('e:/A/src/app/(app)/projects');
let c = fs.readFileSync(path.join(dir, 'form-listagem-a.tsx'), 'utf8');

c = c.replaceAll('listagemA', 'listagemB');
c = c.replaceAll('FormListagemA', 'FormListagemBComum');
c = c.replace(
  "import { FormListagemATecnico } from './form-listagem-a-tecnico';",
  "import { FormListagemBEspecifico } from './form-listagem-b-especifico';",
);
c = c.replaceAll('FormListagemATecnico', 'FormListagemBEspecifico');

// Remove seções específicas da Listagem A (minerária)
c = c.replace(
  /\s*<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">24 e 25\.[\s\S]*?<\/div>\s*<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">26\. Acessos[\s\S]*?<\/div>\s*/,
  '\n',
);

fs.writeFileSync(path.join(dir, 'form-listagem-b-comum.tsx'), c);
console.log('OK');
