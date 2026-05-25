'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import type { MmBrandedPdfSession } from '@/lib/pdf-branding-layout';
import type { Prada } from '@/lib/types';
import { buildPradaExportBaseName } from '@/lib/prada/prada-export-filename';

export type PradaPdfExportResult = {
  blob: Blob;
  fileName: string;
};

function fmt(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

function renderSection(
  session: MmBrandedPdfSession,
  title: string,
  lines: string[],
  startY: number,
): number {
  let y = writeBrandedPdfTitle(session, title, 12, startY);
  for (const line of lines) {
    if (!line.trim()) continue;
    y = writeBrandedPdfParagraph(session, line, 10, y);
  }
  return y + 4;
}

export async function generatePradaExportPdfBlob(
  prada: Prada,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<PradaPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: !!(
      brandingData?.headerImageUrl ||
      brandingData?.footerImageUrl ||
      brandingData?.watermarkImageUrl
    ),
  });
  if (!session) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }

  const { doc } = session;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight * 0.28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const title = 'PLANO DE RECUPERAÇÃO DE ÁREAS DEGRADADAS (PRADA)';
  const titleLines = doc.splitTextToSize(title, session.contentWidth);
  for (const line of titleLines) {
    doc.text(line, session.margins.left, y);
    y += 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y += 6;
  for (const line of [
    fmt(prada.empreendimento?.nome),
    fmt(prada.requerente?.nome),
    `Status: ${fmt(prada.status ?? 'Rascunho')}`,
    new Date().toLocaleDateString('pt-BR'),
  ]) {
    doc.text(line, session.margins.left, y);
    y += 7;
  }

  y = session.ensureSpace(y + 8, 40);
  y = renderSection(
    session,
    '1. Requerente',
    [
      `Nome: ${fmt(prada.requerente?.nome)}`,
      `CPF/CNPJ: ${fmt(prada.requerente?.cpfCnpj)}`,
    ],
    y,
  );

  if (prada.proprietario?.nome) {
    y = renderSection(
      session,
      '1.1 Proprietário',
      [
        `Nome: ${fmt(prada.proprietario.nome)}`,
        `CPF/CNPJ: ${fmt(prada.proprietario.cpfCnpj)}`,
      ],
      y,
    );
  }

  y = renderSection(
    session,
    '2. Empreendimento',
    [
      `Nome: ${fmt(prada.empreendimento?.nome)}`,
      `Denominação: ${fmt(prada.empreendimento?.denominacao)}`,
      `CAR: ${fmt(prada.empreendimento?.car)}`,
      `Matrícula: ${fmt(prada.empreendimento?.matricula)}`,
    ],
    y,
  );

  const rt = prada.responsavelTecnico;
  y = renderSection(
    session,
    '3. Responsável técnico',
    [
      `Nome: ${fmt(rt?.nome)}`,
      `CPF: ${fmt(rt?.cpf)}`,
      `Formação: ${fmt(rt?.formacao)}`,
      `Registro: ${fmt(rt?.registroConselho)}`,
      `ART: ${fmt(rt?.art)}`,
    ],
    y,
  );

  if (prada.objetivoDescricao || prada.objetivosPrada?.length) {
    y = renderSection(
      session,
      '4. Objetivo do PRADA',
      [
        prada.objetivosPrada?.length
          ? `Objetivos: ${prada.objetivosPrada.join('; ')}`
          : '',
        prada.objetivoDescricao ? `Descrição: ${prada.objetivoDescricao}` : '',
      ].filter(Boolean),
      y,
    );
  }

  if (prada.areasRecuperacao?.length) {
    const areaLines = prada.areasRecuperacao.map(
      (a, i) =>
        `${i + 1}. ${fmt(a.identificacao)} (${a.extensao ?? '—'} ha) — ${fmt(a.descricao)}`,
    );
    y = renderSection(session, '5. Áreas de recuperação', areaLines, y);
  }

  if (prada.cronograma?.length) {
    const cronLines = prada.cronograma.map((e, i) => {
      const inicio =
        e.dataInicio instanceof Date
          ? e.dataInicio.toLocaleDateString('pt-BR')
          : e.dataInicio
            ? new Date(e.dataInicio).toLocaleDateString('pt-BR')
            : '—';
      const fim =
        e.dataFim instanceof Date
          ? e.dataFim.toLocaleDateString('pt-BR')
          : e.dataFim
            ? new Date(e.dataFim).toLocaleDateString('pt-BR')
            : '—';
      return `${i + 1}. ${fmt(e.etapa)} — ${inicio} a ${fim}`;
    });
    y = renderSection(session, '6. Cronograma', cronLines, y);
  }

  if (prada.referenciasBibliograficas) {
    y = renderSection(
      session,
      '7. Referências bibliográficas',
      [prada.referenciasBibliograficas],
      y,
    );
  }

  const blob = doc.output('blob');
  const base = buildPradaExportBaseName(prada);
  return { blob, fileName: `${base}.pdf` };
}
