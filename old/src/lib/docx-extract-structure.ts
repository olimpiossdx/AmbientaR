/**
 * Extração de estrutura de arquivos DOCX/DOTX (placeholders e títulos).
 * Usado para gerar schema de formulário dinâmico a partir do documento base.
 */

import { promises as fs } from 'fs';
import type { DocxStructure } from '@/lib/study-form-schema';

const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Lê o arquivo DOCX/DOTX e extrai placeholders {{...}} e títulos (parágrafos com estilo Heading).
 */
export async function extractDocxStructure(filePath: string): Promise<DocxStructure> {
  const buffer = await fs.readFile(filePath);
  const PizZip = (await import('pizzip')).default;
  const zip = new PizZip(buffer);
  const documentXml = zip.files['word/document.xml'];
  if (!documentXml) {
    return { placeholders: [], headings: [] };
  }

  const xml = await (documentXml as any).async('string');
  const fullText = getFullTextFromDocumentXml(xml);
  const placeholders = extractPlaceholdersFromText(fullText);
  const headings = extractHeadingsFromXml(xml);
  return { placeholders, headings };
}

/** Concatena todo o texto do documento para capturar placeholders que podem estar em vários <w:t>. */
function getFullTextFromDocumentXml(xml: string): string {
  const parts: string[] = [];
  const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    parts.push(m[1] || '');
  }
  return parts.join('');
}

function extractPlaceholdersFromText(text: string): string[] {
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  PLACEHOLDER_REGEX.lastIndex = 0;
  while ((m = PLACEHOLDER_REGEX.exec(text)) !== null) {
    const inner = m[1].trim();
    if (inner) set.add(inner);
  }
  return Array.from(set);
}

/**
 * Extrai títulos a partir de parágrafos com w:pStyle w:val="HeadingN".
 * DOCX: <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Texto</w:t></w:r></w:p>
 */
function extractHeadingsFromXml(xml: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const pRegex = /<w:p\s[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(xml)) !== null) {
    const block = pMatch[1];
    const styleMatch = block.match(/<w:pStyle\s+w:val="Heading(\d?)"/i);
    const level = styleMatch ? parseInt(styleMatch[1] || '1', 10) : 0;
    const text = extractTextFromParagraphBlock(block);
    if (level > 0 && text.trim()) {
      headings.push({ level, text: text.trim() });
    }
  }
  return headings;
}

function extractTextFromParagraphBlock(block: string): string {
  const parts: string[] = [];
  const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(block)) !== null) {
    parts.push(m[1] || '');
  }
  return parts.join('').replace(/\s+/g, ' ').trim();
}
