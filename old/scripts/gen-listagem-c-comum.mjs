import fs from 'fs';
import path from 'path';

const dir = path.join('e:/A/src/app/(app)/projects');
let c = fs.readFileSync(path.join(dir, 'form-listagem-b-comum.tsx'), 'utf8');

c = c.replaceAll('listagemB', 'listagemC');
c = c.replaceAll('FormListagemB', 'FormListagemC');
c = c.replace(
  "import { FormListagemBEspecifico } from './form-listagem-b-especifico';",
  "import { FormListagemCEspecifico } from './form-listagem-c-especifico';\nimport { FormListagemCSecao6 } from './form-listagem-c-secao6';",
);
c = c.replaceAll('FormListagemBEspecifico', 'FormListagemCEspecifico');

// Remove bloco genérico de atividades (substituído pela seção 6 da borracha)
c = c.replace(
  /\s*<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">6\. Atividades[\s\S]*?<\/div>\s*(?=<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">7\.)/,
  '\n      <FormListagemCSecao6 form={form} />\n\n',
);

// RH e regime vão para o módulo técnico (itens 22–24)
c = c.replace(
  /\s*<div className="space-y-4 rounded-md border p-4">\s*<h3 className="text-lg font-medium">21 e 22\. Recursos Humanos[\s\S]*?<\/div>\s*(?=<FormListagemCEspecifico)/,
  '\n',
);

c = c.replace(
  'Para fase operacional (LO/LOC), revisar com atenção os blocos de efluentes, emissões e resíduos (itens 45 a 51).',
  'Para fase operacional (LO/LOC), revisar com atenção os blocos de efluentes, emissões e resíduos (itens 29 a 36).',
);

fs.writeFileSync(path.join(dir, 'form-listagem-c-comum.tsx'), c);
console.log('OK');
