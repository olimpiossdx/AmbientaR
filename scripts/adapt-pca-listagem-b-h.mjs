/**
 * Adapta formulários de empreendimentos (Listagens B–H) para PCA.
 * Converte helpers (SectionCard, TextField, …) e mantém FormField complexos intactos.
 * Uso: node scripts/adapt-pca-listagem-b-h.mjs [B C D ...]
 */
import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src/app/(app)');
const projects = path.join(root, 'projects');
const pcaLib = path.join(root, 'studies/pca/lib');

const LETTERS = process.argv.slice(2).length
  ? process.argv.slice(2).map((l) => l.toUpperCase())
  : ['B', 'C', 'D', 'E', 'F', 'G', 'H'];

const DEST_OVERRIDES = {
  'form-listagem-f-comum.tsx': 'pca-form-listagem-f-posto-combustivel.tsx',
  'form-listagem-e-comum.tsx': 'pca-form-listagem-e-dutos-gasodutos.tsx',
  'form-listagem-d-aguardente.tsx': 'pca-form-listagem-d-aguardenete-cana.tsx',
};

const SKIP_FILES = new Set([
  'form-listagem-b-comum.tsx',
  'form-listagem-c-comum.tsx',
  'form-listagem-d-comum.tsx',
]);

const EXPORT_RENAMES = {
  FormListagemFPostoCombustivel: 'PcaFormListagemFPostoCombustivel',
  FormListagemEDutosGasodutos: 'PcaFormListagemEDutosGasodutos',
  FormListagemDAguardente: 'PcaFormListagemDAguardenteCana',
  FormListagemGeralBase: 'PcaFormListagemGeralBase',
};

const ORCHESTRATOR_SUFFIXES = [
  'ferroligas.tsx',
  'fundidos-ferro-aco.tsx',
  'nao-ferrosos.tsx',
  'pneumaticos.tsx',
  'plasticos.tsx',
  'papel.tsx',
  'domissanitarios.tsx',
  'aguardenete-cana.tsx',
  'dutos-gasodutos.tsx',
  'posto-combustivel.tsx',
  '-principal.tsx',
  '-geral.tsx',
];

function stripAllImports(source) {
  return source.replace(/^('use client';\s*)?(?:import[\s\S]*?;\s*)+/m, '');
}

function restoreLocalImports(original, letter) {
  const lower = letter.toLowerCase();
  const restored = [];
  const importBlockRe = /^import[\s\S]*?from\s+'[^']+';/gm;
  let match;
  while ((match = importBlockRe.exec(original)) !== null) {
    const block = match[0];
    if (block.includes("form-listagem-a-helpers")) continue;
    const isLocal =
      block.includes(`form-listagem-${lower}-`) ||
      block.includes('form-listagem-geral-base') ||
      block.includes(`listagem-${lower}-form-registry`) ||
      block.includes('form-listagem-e-coordenadas');
    if (!isLocal) continue;

    let converted = block;
    if (converted.includes('form-listagem-e-coordenadas')) {
      converted = converted.replace(
        /'\.\/form-listagem-e-coordenadas'/g,
        "'./pca-form-listagem-e-coordenadas'",
      );
    } else {
      converted = converted.replace(new RegExp(`form-listagem-${lower}-`, 'g'), `pca-form-listagem-${lower}-`);
    }
    converted = converted.replace(/'\.\/form-listagem-geral-base'/g, "'../lib/pca-form-geral-base'");
    converted = converted.replace(
      new RegExp(`listagem-${lower}-form-registry`, 'g'),
      `pca-listagem-${lower}-registry`,
    );
    for (const [src, dest] of Object.entries(DEST_OVERRIDES)) {
      converted = converted.replace(src.replace('.tsx', ''), dest.replace('.tsx', ''));
    }
    converted = converted.replace(/FormListagemGeralBase/g, 'PcaFormListagemGeralBase');
    converted = converted.replace(new RegExp(`(?<!Pca)FormListagem${letter}`, 'g'), `PcaFormListagem${letter}`);
    converted = converted.replace(
      new RegExp(`inferirFormularioListagem${letter}`, 'g'),
      `inferirFormularioPcaListagem${letter}`,
    );
    converted = converted.replace(new RegExp(`LISTAGEM_${letter}_`, 'g'), `PCA_LISTAGEM_${letter}_`);
    restored.push(converted);
  }
  return restored.join('\n');
}

function pcaImportsFor(letter, { inLib = false, omitBooleanRadio = false } = {}) {
  const helpers = inLib ? './pca-form-helpers' : '../lib/pca-form-helpers';
  const medidas = inLib ? './pca-medidas-section' : '../lib/pca-medidas-section';
  const booleanLine = omitBooleanRadio ? '' : '  BooleanRadio,\n';
  const listagemLetterImport = inLib
    ? "import type { ListagemLetter } from '@/app/(app)/projects/listagem-form-activity';\n"
    : '';
  return `${listagemLetterImport}import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
${booleanLine}  CaracterizacaoEfluenteAntesDepois,
  DetalhesControleEmissoes,
  DisposicaoTemporariaResiduo,
  PcaCheckboxOptions,
  PcaNumField,
  PcaSectionCard,
  PcaSituacaoRegularizacao,
  PcaTabelaLinhasFixas,
  PcaTextField,
  PcaTextAreaField,
} from '${helpers}';
import { PcaMedidasSection } from '${medidas}';
`;
}

function adaptContent(source, letter, { inLib = false } = {}) {
  const localImports = restoreLocalImports(source, letter);
  const omitBooleanRadio = /function BooleanRadio\s*\(/.test(source);
  let content = stripAllImports(source);
  content = `'use client';\n\n${pcaImportsFor(letter, { inLib, omitBooleanRadio })}${localImports ? `${localImports}\n` : ''}${content}`;

  content = content
    .replace(/\bSectionCard\b/g, 'PcaSectionCard')
    .replace(/\bNumField\b/g, 'PcaNumField')
    .replace(/\bCheckboxOptions\b/g, 'PcaCheckboxOptions')
    .replace(/\bTabelaLinhasFixas\b/g, 'PcaTabelaLinhasFixas')
    .replace(/\bSituacaoRegularizacao\b/g, 'PcaSituacaoRegularizacao')
    .replace(/\bTextField\b/g, 'PcaTextField');

  content = content.replace(
    new RegExp(`from '\\./form-listagem-${letter.toLowerCase()}-`, 'g'),
    `from './pca-form-listagem-${letter.toLowerCase()}-`,
  );
  content = content.replace(
    /from '\.\/form-listagem-geral-base'/g,
    "from '../lib/pca-form-geral-base'",
  );

  content = content.replace(
    new RegExp(`from '\\./listagem-${letter.toLowerCase()}-form-registry'`, 'g'),
    `from './pca-listagem-${letter.toLowerCase()}-registry'`,
  );
  content = content.replace(
    new RegExp(`inferirFormularioListagem${letter}`, 'g'),
    `inferirFormularioPcaListagem${letter}`,
  );
  content = content.replace(new RegExp(`(?<!PCA_)LISTAGEM_${letter}_`, 'g'), `PCA_LISTAGEM_${letter}_`);

  content = content.replace(
    /import \{ aplicarFormularioTipoListagem \} from '\.\/listagem-form-inferencia';[\r\n]+/g,
    '',
  );
  content = content.replace(
    /import type \{ ListagemLetter \} from '\.\/listagem-form-activity';[\r\n]+/g,
    "import type { ListagemLetter } from '@/app/(app)/projects/listagem-form-activity';\n",
  );
  content = content.replace(
    /const onCodigoBlur = \(codigo: string\) => \{[\s\S]*?\};\s*/g,
    '',
  );
  content = content.replace(/\s*onBlur=\{\(e\) => onCodigoBlur\(e\.target\.value\)\}/g, '');
  content = content.replace(/aplicarFormularioTipoListagem\([\s\S]*?\);\s*/g, '');
  content = content.replace(/\s+onBlur=\{\([^)]*\) => \{[\s\S]*?\}\}/g, '');
  content = content.replace(/\s+onBlur=\{[^}]+\}/g, '');
  content = content.replace(/\bLISTAGEM_D_CODIGO_AGUARDENTE\b/g, 'PCA_LISTAGEM_D_CODIGO_AGUARDENTE');
  content = content.replace(/\bLISTAGEM_F_CODIGO_POSTO\b/g, 'PCA_LISTAGEM_F_CODIGO_POSTO');

  content = content.replace(
    /(useFieldArray\(\{[\s\S]*?name: )'([^']+)'(\s*\}\))/g,
    "$1'$2' as never$3",
  );

  content = content.replace(
    /field\.value\?\.includes\(/g,
    '(Array.isArray(field.value) ? field.value : []).includes(',
  );

  for (const [from, to] of Object.entries(EXPORT_RENAMES)) {
    content = content.replace(new RegExp(`\\b(?<!Pca)${from}\\b`, 'g'), to);
  }
  content = content.replace(
    new RegExp(`\\b(?<!Pca)FormListagem${letter}([A-Za-z0-9]+)`, 'g'),
    `PcaFormListagem${letter}$1`,
  );

  content = content.replace(/PCA_PCA_/g, 'PCA_').replace(/PcaPcaForm/g, 'PcaForm');

  return content;
}

function destName(srcName, letter) {
  if (DEST_OVERRIDES[srcName]) return DEST_OVERRIDES[srcName];
  const lower = letter.toLowerCase();
  if (srcName === 'form-listagem-geral-base.tsx') return 'pca-form-geral-base.tsx';
  return srcName.replace(`form-listagem-${lower}-`, `pca-form-listagem-${lower}-`);
}

function shouldAppendMedidas(destFile) {
  return ORCHESTRATOR_SUFFIXES.some((s) => destFile.endsWith(s));
}

function appendMedidasSection(content) {
  if (content.includes('PcaMedidasSection')) return content;
  const marker = '\n    </div>\n  );\n}';
  const lastClose = content.lastIndexOf(marker);
  if (lastClose === -1) return content;
  return content.slice(0, lastClose) + '\n      <PcaMedidasSection form={form} />' + content.slice(lastClose);
}

function listSourceFiles(letter) {
  const lower = letter.toLowerCase();
  const re = new RegExp(`^form-listagem-${lower}(?:-|$)`);
  return fs
    .readdirSync(projects)
    .filter((f) => f.endsWith('.tsx') && re.test(f) && f !== `form-listagem-${lower}.tsx`)
    .filter((f) => !SKIP_FILES.has(f));
}

const geralBaseSrc = path.join(projects, 'form-listagem-geral-base.tsx');
if (fs.existsSync(geralBaseSrc)) {
  fs.writeFileSync(path.join(pcaLib, 'pca-form-geral-base.tsx'), adaptContent(fs.readFileSync(geralBaseSrc, 'utf8'), 'B', { inLib: true }), 'utf8');
  console.log('Wrote pca/lib/pca-form-geral-base.tsx');
}

for (const letter of LETTERS) {
  const pcaDir = path.join(root, `studies/pca/listagem-${letter.toLowerCase()}`);
  if (!fs.existsSync(pcaDir)) continue;

  const files = listSourceFiles(letter);
  console.log(`\n=== Listagem ${letter} (${files.length} ficheiros) ===`);

  for (const srcName of files) {
    const destFile = destName(srcName, letter);
    const destPath =
      srcName === 'form-listagem-geral-base.tsx'
        ? path.join(pcaLib, destFile)
        : path.join(pcaDir, destFile);

    let content = adaptContent(fs.readFileSync(path.join(projects, srcName), 'utf8'), letter);
    if (shouldAppendMedidas(destFile)) {
      content = appendMedidasSection(content);
    }
    fs.writeFileSync(destPath, content, 'utf8');
    console.log('  ', srcName, '→', destFile);
  }
}

console.log('\nConcluído.');
