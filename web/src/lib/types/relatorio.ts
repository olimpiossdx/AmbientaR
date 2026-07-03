/**
 * Tipos e schemas para Documentos/Estudos gerados ou preenchidos pela IA.
 * Usados pelos fluxos preencherRelatorio e gerarTor.
 */

import { z } from 'zod';

// --- Fonte usada pela IA (para rastreabilidade) ---

export const FonteIASchema = z.object({
  tipo: z.enum(['campo', 'api', 'tool']),
  nome: z.string(),
  valorOuRef: z.string().optional(),
});

export type FonteIA = z.infer<typeof FonteIASchema>;

// --- Seção de um relatório ---

export const SecaoRelatorioSchema = z.object({
  titulo: z.string(),
  conteudo: z.string(),
  fontes: z.array(FonteIASchema).optional(),
  revisar: z.boolean().optional(),
});

export type SecaoRelatorio = z.infer<typeof SecaoRelatorioSchema>;

// --- Rascunho gerado pela IA ---

export const RascunhoIASchema = z.object({
  geradoEm: z.string(), // ISO
  tipoDocumento: z.string(), // slug: rca, ptrf, prada, etc.
  conteudo: z.string().optional(), // texto completo (Markdown/HTML)
  secoes: z.array(SecaoRelatorioSchema).optional(),
  fontes: z.array(FonteIASchema).optional(),
  instrucoesUsadas: z.string().optional(),
});

export type RascunhoIA = z.infer<typeof RascunhoIASchema>;

// --- Documento/Estudo (persistido no processo) ---

export const DocumentoEstudoSchema = z.object({
  id: z.string().optional(),
  tipo: z.string(), // rca, ptrf, tor, eia-rima, etc.
  titulo: z.string().optional(),
  status: z.enum(['rascunho', 'em_revisao', 'final']).optional(),
  conteudo: z.string().optional(),
  rascunhoIA: RascunhoIASchema.optional(),
  atualizadoEm: z.string().optional(),
  atualizadoPor: z.string().optional(),
});

export type DocumentoEstudo = z.infer<typeof DocumentoEstudoSchema>;

// --- Input para fluxo "preencher relatório" ---

export const PreencherRelatorioInputSchema = z.object({
  processoId: z.string(),
  tipoDocumento: z.string(),
  secaoUnica: z.string().optional(),
});

export type PreencherRelatorioInput = z.infer<typeof PreencherRelatorioInputSchema>;

// --- Output do fluxo "preencher relatório" ---

export const PreencherRelatorioOutputSchema = z.object({
  conteudo: z.string().optional(),
  secoes: z.array(SecaoRelatorioSchema).optional(),
  fontes: z.array(FonteIASchema).optional(),
});

export type PreencherRelatorioOutput = z.infer<typeof PreencherRelatorioOutputSchema>;

// --- Input para fluxo "gerar ToR" ---

export const GerarTorInputSchema = z.object({
  processoId: z.string(),
  tipoEstudo: z.string(),
});

export type GerarTorInput = z.infer<typeof GerarTorInputSchema>;

// --- Output do fluxo "gerar ToR" ---

export const GerarTorOutputSchema = z.object({
  conteudo: z.string(),
  fontes: z.array(FonteIASchema).optional(),
});

export type GerarTorOutput = z.infer<typeof GerarTorOutputSchema>;
