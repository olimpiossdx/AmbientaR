/**
 * Importa termos de referência (PDF/DOCX/DOTX) da pasta local para o Firestore:
 * - Cria uma fonte em knowledge_sources (tipo termo_referencia) por arquivo.
 * - Cria trechos em rag_index (quebra por parágrafo, mín. 50 caracteres).
 *
 * Uso:
 *   cd scripts/import-termos-referencia && npm install && npm start
 *
 * Variáveis de ambiente:
 *   GOOGLE_APPLICATION_CREDENTIALS  Caminho para o JSON da conta de serviço Firebase (obrigatório para escrever).
 *   TERMOS_REFERENCIA_DIR          Pasta com os arquivos (padrão: ../../termos de referencia em relação ao script).
 *   FIREBASE_PROJECT_ID            ID do projeto (padrão: studio-316805764-e4d13).
 *   DRY_RUN=true                   Só lista arquivos e trechos, não grava no Firestore.
 */

const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const admin = require('firebase-admin');

const MIN_CHUNK_LENGTH = 50;
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_DIR = path.join(PROJECT_ROOT, 'termos de referencia');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'studio-316805764-e4d13';
const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';

function getAllDocFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) getAllDocFiles(full, acc);
    else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (['.pdf', '.docx', '.dotx'].includes(ext)) acc.push(full);
    }
  }
  return acc;
}

function buildTitle(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  const parentName = path.basename(dir);
  if (parentName && parentName !== 'termos de referencia' && !/^\d+\./.test(parentName)) {
    return `${parentName} – ${base}`;
  }
  return base;
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.docx', '.dotx'].includes(ext)) {
    const result = await mammoth.extractRawText({ path: filePath });
    return (result && result.value) ? result.value : '';
  }
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return (data && data.text) ? data.text : '';
  }
  return '';
}

function chunkText(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CHUNK_LENGTH);
}

function main() {
  const dir = process.env.TERMOS_REFERENCIA_DIR || DEFAULT_DIR;
  console.log('Pasta:', dir);
  if (!fs.existsSync(dir)) {
    console.error('Pasta não encontrada:', dir);
    process.exit(1);
  }

  const files = getAllDocFiles(dir);
  console.log('Arquivos encontrados:', files.length);
  if (files.length === 0) {
    console.log('Nenhum .pdf, .docx ou .dotx encontrado.');
    return;
  }

  if (DRY_RUN) {
    console.log('\n[DRY_RUN] Nenhuma escrita no Firestore. Arquivos:');
    files.forEach((f) => console.log('  -', path.relative(PROJECT_ROOT, f)));
    return;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho do JSON da conta de serviço Firebase.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const firestore = admin.firestore();

  (async () => {
    for (const filePath of files) {
      const rel = path.relative(PROJECT_ROOT, filePath);
      let text;
      try {
        text = await extractText(filePath);
      } catch (err) {
        console.warn('Erro ao extrair texto:', rel, err.message);
        continue;
      }
      const chunks = chunkText(text);
      if (chunks.length === 0) {
        console.warn('Sem trechos válidos (mín. 50 caracteres por parágrafo):', rel);
        continue;
      }
      const titulo = buildTitle(filePath);
      const sourceRef = await firestore.collection('knowledge_sources').add({
        tipo: 'termo_referencia',
        uf: 'MG',
        orgao: 'SEMAD',
        numero: path.basename(filePath),
        titulo,
        status: 'vigente',
        modoInclusao: 'manual',
        aprovado: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const sourceId = sourceRef.id;
      for (let i = 0; i < chunks.length; i++) {
        await firestore.collection('rag_index').add({
          sourceId,
          tipoDocumento: 'termo_referencia',
          uf: 'MG',
          orgao: 'SEMAD',
          numero: path.basename(filePath),
          titulo,
          chunkText: chunks[i],
          chunkIndex: i,
          referencias: {},
        });
      }
      console.log('OK:', rel, '→', chunks.length, 'trechos');
    }
    console.log('Concluído.');
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
