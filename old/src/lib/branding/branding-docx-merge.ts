import type { BrandingPdfImages } from '@/lib/branding-pdf';
import { buildBrandedDocxSectionSetup } from '@/lib/branding/branding-docx-setup';

/**
 * Aplica cabeçalho, marca d'água e rodapé (identidade visual) a um DOCX já gerado
 * (ex.: saída do Docxtemplater), reutilizando o mesmo motor do export de ofícios.
 */
export async function applyBrandingToDocxBuffer(
  docxBuffer: Buffer,
  pdfImages: BrandingPdfImages,
): Promise<Buffer> {
  const PizZip = (await import('pizzip')).default;
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const branded = await buildBrandedDocxSectionSetup(pdfImages);
  const shellDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: branded.pageMargins,
          },
        },
        headers: branded.headers,
        footers: branded.footers,
        children: [
          new Paragraph({
            children: [new TextRun({ text: '' })],
          }),
        ],
      },
    ],
  });

  const shellBuf = (await Packer.toBuffer(shellDoc)) as Buffer;
  const shellZip = new PizZip(shellBuf);
  const targetZip = new PizZip(docxBuffer);

  const shellWord = shellZip.folder('word');
  const targetWord = targetZip.folder('word');
  if (!shellWord || !targetWord) {
    return docxBuffer;
  }

  const shellKeys = Object.keys(shellZip.files);
  const headerKey = shellKeys.find((k) => /^word\/header\d+\.xml$/.test(k));
  const footerKey = shellKeys.find((k) => /^word\/footer\d+\.xml$/.test(k));
  if (!headerKey || !footerKey) {
    return docxBuffer;
  }

  targetZip.remove(headerKey);
  targetZip.remove(footerKey);
  targetZip.file(headerKey, shellZip.file(headerKey)!.asText());
  targetZip.file(footerKey, shellZip.file(footerKey)!.asText());

  const headerFile = headerKey.replace('word/', '');
  const footerFile = footerKey.replace('word/', '');
  const headerRels = `word/_rels/${headerFile}.rels`;
  const footerRels = `word/_rels/${footerFile}.rels`;
  if (shellZip.file(headerRels)) {
    targetZip.remove(headerRels);
    targetZip.file(headerRels, shellZip.file(headerRels)!.asText());
  }
  if (shellZip.file(footerRels)) {
    targetZip.remove(footerRels);
    targetZip.file(footerRels, shellZip.file(footerRels)!.asText());
  }

  for (const key of shellKeys) {
    if (key.startsWith('word/media/') && !key.endsWith('/')) {
      targetZip.remove(key);
      targetZip.file(key, shellZip.file(key)!.asNodeBuffer());
    }
  }

  mergeContentTypes(targetZip, shellZip, headerFile, footerFile);
  mergeDocumentRels(targetZip, shellZip, headerFile, footerFile);
  injectSectionHeaderFooterRefs(targetZip, headerFile, footerFile);

  return targetZip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  }) as Buffer;
}

function mergeContentTypes(
  targetZip: import('pizzip'),
  shellZip: import('pizzip'),
  headerFile: string,
  footerFile: string,
): void {
  const ctPath = '[Content_Types].xml';
  let ct = targetZip.file(ctPath)?.asText() ?? shellZip.file(ctPath)?.asText() ?? '';
  const headerPart = `/word/${headerFile}`;
  const footerPart = `/word/${footerFile}`;

  if (!ct.includes(headerPart)) {
    ct = ct.replace(
      '</Types>',
      `<Override PartName="${headerPart}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>`,
    );
  }
  if (!ct.includes(footerPart)) {
    ct = ct.replace(
      '</Types>',
      `<Override PartName="${footerPart}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`,
    );
  }
  targetZip.file(ctPath, ct);
}

function mergeDocumentRels(
  targetZip: import('pizzip'),
  shellZip: import('pizzip'),
  headerFile: string,
  footerFile: string,
): void {
  const relsPath = 'word/_rels/document.xml.rels';
  let rels = targetZip.file(relsPath)?.asText() ?? '';
  const shellRels = shellZip.file(relsPath)?.asText() ?? '';

  const relBlocks = shellRels.match(/<Relationship[^>]+>/g) ?? [];
  for (const block of relBlocks) {
    if (
      block.includes('header') ||
      block.includes('footer') ||
      block.includes('/media/')
    ) {
      const idMatch = block.match(/Id="([^"]+)"/);
      if (idMatch && !rels.includes(`Id="${idMatch[1]}"`)) {
        rels = rels.replace('</Relationships>', `${block}</Relationships>`);
      }
    }
  }

  const headerTarget = `word/${headerFile}`;
  const footerTarget = `word/${footerFile}`;
  if (!rels.includes(headerTarget)) {
    const shellHeaderRel = relBlocks.find((b) => b.includes(headerTarget));
    if (shellHeaderRel) {
      rels = rels.replace('</Relationships>', `${shellHeaderRel}</Relationships>`);
    }
  }
  if (!rels.includes(footerTarget)) {
    const shellFooterRel = relBlocks.find((b) => b.includes(footerTarget));
    if (shellFooterRel) {
      rels = rels.replace('</Relationships>', `${shellFooterRel}</Relationships>`);
    }
  }

  targetZip.file(relsPath, rels);
}

function injectSectionHeaderFooterRefs(
  targetZip: import('pizzip'),
  headerFile: string,
  footerFile: string,
): void {
  const docPath = 'word/document.xml';
  let xml = targetZip.file(docPath)?.asText();
  if (!xml) return;

  const relsPath = 'word/_rels/document.xml.rels';
  const rels = targetZip.file(relsPath)?.asText() ?? '';
  const headerRId = rels.match(
    new RegExp(`Id="(rId\\d+)"[^>]+Target="${headerFile.replace('.', '\\.')}"`),
  )?.[1];
  const footerRId = rels.match(
    new RegExp(`Id="(rId\\d+)"[^>]+Target="${footerFile.replace('.', '\\.')}"`),
  )?.[1];

  if (!headerRId || !footerRId) return;

  const headerRef = `<w:headerReference w:type="default" r:id="${headerRId}"/>`;
  const footerRef = `<w:footerReference w:type="default" r:id="${footerRId}"/>`;

  const docXml = xml;
  if (docXml.includes('<w:sectPr')) {
    xml = docXml.replace(/<w:sectPr([^>]*)>/, (match) => {
      let inner = match;
      if (!docXml.includes('w:headerReference')) {
        inner = inner.replace('>', `>${headerRef}`);
      }
      if (!docXml.includes('w:footerReference')) {
        inner = inner.replace('>', `>${footerRef}`);
      }
      return inner;
    });
    if (!xml.includes('w:headerReference')) {
      xml = xml.replace(
        '</w:sectPr>',
        `${headerRef}${footerRef}</w:sectPr>`,
      );
    } else if (!xml.includes('w:footerReference')) {
      xml = xml.replace('</w:sectPr>', `${footerRef}</w:sectPr>`);
    }
  } else {
    xml = xml.replace(
      '</w:body>',
      `<w:sectPr>${headerRef}${footerRef}</w:sectPr></w:body>`,
    );
  }

  targetZip.file(docPath, xml);
}
