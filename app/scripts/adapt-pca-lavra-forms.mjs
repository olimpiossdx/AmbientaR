/**

 * Adapta formulários de lavra subterrânea (empreendimentos) para PCA Listagem A.

 * Uso: node scripts/adapt-pca-lavra-forms.mjs

 */

import fs from 'fs';

import path from 'path';



const root = path.join(process.cwd(), 'src/app/(app)');

const projects = path.join(root, 'projects');

const pcaA = path.join(root, 'studies/pca/listagem-a');



const PCA_IMPORTS = `'use client';



import * as React from 'react';

import { useFieldArray } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Checkbox } from '@/components/ui/checkbox';

import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { PlusCircle, Trash2 } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

import {

  PcaBooleanRadio,

  PcaCheckboxOptions,

  PcaNumField,

  PcaSectionCard,

  PcaTabelaLinhasFixas,

  PcaTextField,

  PcaTextAreaField,

  PcaSituacaoRegularizacao,

} from './pca-form-listagem-a-helpers';

`;



function escapeLabel(label) {

  return label.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();

}



function convertFormFieldBlocks(content) {

  const re =

    /<FormField\s+control=\{form\.control\}\s+name="([^"]+)"\s+render=\{\(\{ field \}\) => \(([\s\S]*?)\)\s*\}\s*\/>/g;



  return content.replace(re, (match, name, inner) => {

    if (/<Textarea[\s\S]*?\{\.\.\.field\}/.test(inner)) {

      const labelMatch = inner.match(/<FormLabel>([\s\S]*?)<\/FormLabel>/);

      const label = labelMatch ? escapeLabel(labelMatch[1]) : '';

      return `<PcaTextAreaField form={form} name="${name}" label="${label}" />`;

    }

    if (/<BooleanRadio[\s\S]*?\/>/.test(inner)) {

      const labelMatch = inner.match(/<FormLabel>([\s\S]*?)<\/FormLabel>/);

      const label = labelMatch ? escapeLabel(labelMatch[1]) : '';

      return `<PcaBooleanRadio form={form} name="${name}" label="${label}" />`;

    }

    return match;

  });

}



function adaptContent(source, { renameExports = {}, stripLeading = true } = {}) {

  let content = source;

  if (stripLeading) {

    content = content.replace(/^[\s\S]*?from '\.\/form-listagem-a-helpers';[\r\n]+/m, '');

    content = PCA_IMPORTS + content.replace(/^'use client';[\r\n]+/m, '');

  } else {

    content = PCA_IMPORTS + content;

  }



  content = content

    .replace(/\bSectionCard\b/g, 'PcaSectionCard')

    .replace(/\bTextField\b/g, 'PcaTextField')

    .replace(/\bNumField\b/g, 'PcaNumField')

    .replace(/\bCheckboxOptions\b/g, 'PcaCheckboxOptions')

    .replace(/\bTabelaLinhasFixas\b/g, 'PcaTabelaLinhasFixas')

    .replace(/form: UseFormReturn<PcaListagemAFormValues>/g, 'form: UseFormReturn<any>');



  content = convertFormFieldBlocks(content);



  content = content.replace(

    /<FormField control=\{form\.control\} name="([^"]+)" render=\{\(\{ field \}\) => \(<FormItem><FormLabel>([^<]*)<\/FormLabel><FormControl><Input[^/]*\{\.\.\.field\}[^/]*\/><\/FormControl>(?:<FormMessage\s*\/>)?<\/FormItem>\)\} \/>/g,

    '<PcaTextField form={form} name="$1" label="$2" />',

  );



  content = content.replace(

    /<FormField control=\{form\.control\} name="([^"]+)" render=\{\(\{ field \}\) => \(<FormItem(?: className="[^"]*")?><FormLabel>([^<]*)<\/FormLabel><FormControl><Input[^/]*\{\.\.\.field\}[^/]*\/><\/FormControl><\/FormItem>\)\} \/>/g,

    '<PcaTextField form={form} name="$1" label="$2" />',

  );



  content = content.replace(

    /import \{ FormListagemATecnico \} from '\.\/form-listagem-a-tecnico';[\r\n]+/g,

    "import { PcaFormListagemATecnicoSecoes } from './pca-form-listagem-a-tecnico-secoes';\n",

  );

  content = content.replace(/\bFormListagemATecnico\b/g, 'PcaFormListagemATecnicoSecoes');



  for (const [from, to] of Object.entries(renameExports)) {

    content = content.replace(new RegExp(`export function ${from}`, 'g'), `export function ${to}`);

    content = content.replace(new RegExp(`function ${from}`, 'g'), `function ${to}`);

  }

  content = content.replace(
    /(useFieldArray\(\{[\s\S]*?name: )'([^']+)'(\s*\}\))/g,
    "$1'$2' as never$3",
  );

  content = content.replace(
    /field\.value\?\.includes\(/g,
    '(Array.isArray(field.value) ? field.value : []).includes(',
  );

  content = content.replace(
    /<FormField\s+control=\{form\.control\}\s+name=\{`([^`]+)`\}\s+render=\{\(\{ field \}\) => \(\s*<FormItem>\s*<FormLabel>([\s\S]*?)<\/FormLabel>\s*<FormControl>\s*<BooleanRadio value=\{field\.value\} onChange=\{field\.onChange\} \/>\s*<\/FormControl>\s*<\/FormItem>\s*\)\s*\}\s*\/>/g,
    '<PcaBooleanRadio form={form} name={`$1`} label="$2" />',
  );

  content = content.replace(
    /<FormField\s+control=\{form\.control\}\s+name=\{`([^`]+)`\}\s+render=\{\(\{ field \}\) => \(\s*<FormItem>\s*<FormLabel>([\s\S]*?)<\/FormLabel>\s*<FormControl>\s*<Textarea[^/]*\{\.\.\.field\}[^/]*\/>\s*<\/FormControl>\s*<\/FormItem>\s*\)\s*\}\s*\/>/g,
    '<PcaTextAreaField form={form} name={`$1`} label="$2" />',
  );

  content = content.replace(/\bSituacaoRegularizacao\b/g, 'PcaSituacaoRegularizacao');
  content = content.replace(
    /from '\.\/form-listagem-a-rochas-ornamentais-agendas'/g,
    "from './pca-form-listagem-a-rochas-agendas'",
  );
  content = content.replace(
    /\bFormListagemARochasOrnamentaisAgendas\b/g,
    'PcaFormListagemARochasAgendas',
  );

  return content;

}



const pairs = [

  [

    'form-listagem-a-lavra-subterranea-complemento.tsx',

    'pca-form-listagem-a-lavra-complemento.tsx',

    { renameExports: { FormListagemALavraSubterraneaComplemento: 'PcaFormListagemALavraComplemento' } },

  ],

  [

    'form-listagem-a-lavra-subterranea-tecnico.tsx',

    'pca-form-listagem-a-lavra-tecnico.tsx',

    { renameExports: { FormListagemALavraSubterraneaTecnico: 'PcaFormListagemALavraTecnico' } },

  ],

  [

    'form-listagem-a-tecnico.tsx',

    'pca-form-listagem-a-tecnico-secoes.tsx',

    {

      renameExports: {

        FormListagemATecnico: 'PcaFormListagemATecnicoSecoes',

        FormListagemATecnicoParte: 'PcaFormListagemATecnicoParte',

      },

    },

  ],

];



for (const [srcName, destName, opts] of pairs) {

  const src = fs.readFileSync(path.join(projects, srcName), 'utf8');

  fs.writeFileSync(path.join(pcaA, destName), adaptContent(src, opts), 'utf8');

  console.log('Wrote', destName);

}

const rochasPairs = [
  [
    'form-listagem-a-rochas-ornamentais-complemento.tsx',
    'pca-form-listagem-a-rochas-complemento.tsx',
    { renameExports: { FormListagemARochasOrnamentaisComplemento: 'PcaFormListagemARochasComplemento' } },
  ],
  [
    'form-listagem-a-rochas-ornamentais-tecnico.tsx',
    'pca-form-listagem-a-rochas-tecnico.tsx',
    { renameExports: { FormListagemARochasOrnamentaisTecnico: 'PcaFormListagemARochasTecnico' } },
  ],
  [
    'form-listagem-a-rochas-ornamentais-agendas.tsx',
    'pca-form-listagem-a-rochas-agendas.tsx',
    { renameExports: { FormListagemARochasOrnamentaisAgendas: 'PcaFormListagemARochasAgendas' } },
  ],
];

for (const [srcName, destName, opts] of rochasPairs) {
  const src = fs.readFileSync(path.join(projects, srcName), 'utf8');
  fs.writeFileSync(path.join(pcaA, destName), adaptContent(src, opts), 'utf8');
  console.log('Wrote', destName);
}



// Módulo 2 — seções 6–26 do formulário principal (regularização ambiental e cadastro técnico base)

const principalSrc = fs.readFileSync(path.join(projects, 'form-listagem-a-principal.tsx'), 'utf8');

const principalLines = principalSrc.split(/\r?\n/);

const modulo2Body = principalLines.slice(231, 566).join('\n');



const modulo2Wrapper = `

const biomas = ['Cerrado', 'Mata Atlântica', 'Outro'] as const;

const diasSemana = ['2a Feira', '3a Feira', '4a Feira', '5a Feira', '6a Feira', 'Sábado', 'Domingo'] as const;

const mesesAno = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'] as const;



export function PcaFormListagemAModulo2({ form }: { form: UseFormReturn<PcaListagemAFormValues> }) {

  const isAmpliacao = form.watch('listagemA.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado');



  const { fields: atividadePrincipalFields, append: appendAtividadePrincipal, remove: removeAtividadePrincipal } =

    useFieldArray({ control: form.control, name: 'listagemA.atividadesPrincipal' });

  const { fields: outrasAtividadesFields, append: appendOutrasAtividades, remove: removeOutrasAtividades } =

    useFieldArray({ control: form.control, name: 'listagemA.outrasAtividades' });

  const { fields: nucleoPopulacionalFields, append: appendNucleoPopulacional, remove: removeNucleoPopulacional } =

    useFieldArray({ control: form.control, name: 'listagemA.legislacaoMunicipal.nucleosPopulacionais' });

  const { fields: ocupacaoEntornoFields, append: appendOcupacaoEntorno, remove: removeOcupacaoEntorno } =

    useFieldArray({ control: form.control, name: 'listagemA.ocupacaoEntorno.ocorrencias' });

  const { fields: recursosHidricosFields, append: appendRecursosHidricos, remove: removeRecursosHidricos } =

    useFieldArray({ control: form.control, name: 'listagemA.recursosHidricos.intervencoes' });

  const { fields: turnosFields, append: appendTurno, remove: removeTurno } =

    useFieldArray({ control: form.control, name: 'listagemA.regimeOperacao.turnos' });

  const { fields: faseProcessoMineralFields, append: appendFaseProcessoMineral, remove: removeFaseProcessoMineral } =

    useFieldArray({ control: form.control, name: 'listagemA.licenciamentoMineral.fasesProcesso' });



  return (

    <div className="space-y-6">

${modulo2Body}

    </div>

  );

}

`;



fs.writeFileSync(

  path.join(pcaA, 'pca-form-listagem-a-modulo2.tsx'),

  adaptContent(modulo2Wrapper, { stripLeading: false }),

  'utf8',

);

console.log('Wrote pca-form-listagem-a-modulo2.tsx');


