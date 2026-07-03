/**
 * Gera public/templates/barragens/template.docx com placeholders {{...}}
 * Uso: node scripts/generate-barragem-template-docx.mjs
 */
import fs from 'fs';
import path from 'path';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

const sections = [
  ['APRESENTAÇÃO', '{{APRESENTACAO}}'],
  ['1. INFORMAÇÕES BÁSICAS', '{{INFO_TOPOGRAFICAS}}\n\nLatitude: {{LATITUDE}}\nLongitude: {{LONGITUDE}}\nAltitude: {{ALTITUDE}} m'],
  ['2. DEFINIÇÃO DA BARRAGEM', '{{DEFINICAO_BARRAGEM}}'],
  ['3. CAPACIDADE DO RESERVATÓRIO', '{{CAPACIDADE_DESCRICAO}}\n\nCota espelho: {{COTA_ESPELHO_DAGUA}}\nCota terreno: {{COTA_TERRENO_NATURAL}}\nÁrea espelho (m²): {{AREA_ESPELHO_M2}}\nVolume (m³): {{VOLUME_ARMAZENADO_M3}}\n\n{{TABELA_NIVEIS_RESERVATORIO}}'],
  ['4. ATERRO', '{{ATERRO}}'],
  ['5. TALUDES DO ATERRO', '{{TALUDES_ATERRO}}'],
  ['6. FUNDAÇÃO', '{{FUNDACAO}}'],
  ['7. DRENO DE PÉ', '{{DRENO_PE}}'],
  ['8. DESCARGA DE FUNDO', '{{DESCARGA_FUNDO}}'],
  ['9. CÁLCULOS HIDROLÓGICOS', '9.1 {{HID_BACIA}}\n\n9.2 {{HID_TEMPO_CONCENTRACAO}}\n\n9.3 {{HID_INTENSIDADE_CHUVA}}\n\n9.4 {{HID_COEFICIENTE_ESCOAMENTO}}\n\n9.5 {{HID_VAZAO_CHEIA}}'],
  ['10. DIMENSIONAMENTO CAPACIDADE DE CHEIA', '{{DIMENSIONAMENTO_CHEIA}}'],
  ['11. EXTRAVASOR', '{{EXTRAVASOR}}'],
  ['12. IMPLANTAÇÃO DO PROJETO', '{{IMPLANTACAO_PROJETO}}'],
  ['13. CONSERVAÇÃO E MANUTENÇÃO', '{{CONSERVACAO_MANUTENCAO}}'],
  ['14. LITERATURA CONSULTADA', '{{LITERATURA_CONSULTADA}}'],
  ['15. RESPONSABILIDADE TÉCNICA', '{{RT_NOME}} — {{RT_REGISTRO_CONSELHO}}\nART: {{RT_ART}}\n{{LOCAL_EMISSAO}}, {{DATA_EMISSAO}}'],
  ['16. ANEXOS', '{{ANEXOS_DESCRICAO}}'],
];

const children = [
  new Paragraph({
    text: 'PROJETO TÉCNICO DE BARRAGEM',
    heading: HeadingLevel.TITLE,
  }),
  new Paragraph({
    children: [
      new TextRun({ text: '{{EMPREENDIMENTO_NOME}}', bold: true }),
      new TextRun({ text: ' — {{EMPREENDIMENTO_MUNICIPIO}}/{{EMPREENDIMENTO_UF}}' }),
    ],
  }),
  new Paragraph({
    children: [new TextRun('Proprietário: {{REQUERENTE_NOME}} ({{REQUERENTE_CPF_CNPJ}})')],
  }),
  new Paragraph({ children: [new TextRun('Uso: {{USO_PRETENDIDO}}')] }),
  new Paragraph({ children: [new TextRun('')] }),
];

for (const [title, body] of sections) {
  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    ...body.split('\n\n').map(
      (block) =>
        new Paragraph({
          children: [new TextRun(block)],
        }),
    ),
    new Paragraph({ children: [new TextRun('')] }),
  );
}

const doc = new Document({ sections: [{ children }] });
const buf = await Packer.toBuffer(doc);
const outDir = path.join(process.cwd(), 'public', 'templates', 'barragens');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'template.docx');
fs.writeFileSync(outPath, buf);
console.log('Written', outPath, buf.length, 'bytes');
