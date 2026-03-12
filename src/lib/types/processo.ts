/**
 * Tipos e schemas para Processo, Empreendimento e Diagnóstico Técnico.
 * Usados pelos fluxos de IA (enriquecer processo, preencher relatório, gerar ToR).
 * Compatível com as entidades existentes (Empreendedor, Project, etc.).
 */

import { z } from 'zod';

// --- Localização e meio ---

export const LocalSchema = z.object({
  municipio: z.string().optional(),
  uf: z.string().optional(),
  baciaHidrografica: z.string().optional(),
  bioma: z.string().optional(),
  coordenadas: z.string().optional(), // WKT ou GeoJSON string
  numeroCAR: z.string().optional(),
  areaHa: z.number().optional(),
  appHa: z.number().optional(),
  reservaLegalHa: z.number().optional(),
  distanciaUCKm: z.number().optional(),
  nomeUCProxima: z.string().optional(),
  corposDagua: z.array(z.object({ nome: z.string(), tipo: z.string() })).optional(),
  usoSoloAparente: z.string().optional(),
});

export type Local = z.infer<typeof LocalSchema>;

// --- Empreendimento (resumo para IA) ---

export const EmpreendimentoResumoSchema = z.object({
  id: z.string().optional(),
  nome: z.string(),
  cnpjCpf: z.string().optional(),
  atividade: z.string().optional(),
  cnae: z.string().optional(),
  porte: z.string().optional(), // ex: pequeno, medio, grande
  potencialPoluidor: z.string().optional(),
  responsavelTecnico: z.string().optional(),
});

export type EmpreendimentoResumo = z.infer<typeof EmpreendimentoResumoSchema>;

// --- Diagnóstico técnico (resultado do enriquecimento com tools) ---

export const DiagnosticoTecnicoSchema = z.object({
  atualizadoEm: z.string().optional(), // ISO
  car: z.object({
    numero: z.string().optional(),
    areaTotal: z.number().optional(),
    situacao: z.string().optional(),
    appDeclarada: z.number().optional(),
    reservaLegalDeclarada: z.number().optional(),
  }).optional(),
  geo: z.object({
    bioma: z.string().optional(),
    sobreposicaoUC: z.object({
      ocorreu: z.boolean(),
      nomeUC: z.string().optional(),
      distanciaKm: z.number().optional(),
    }).optional(),
    hidrografia: z.array(z.object({ nome: z.string(), tipo: z.string() })).optional(),
  }).optional(),
  fontes: z.array(z.object({
    nome: z.string(),
    usada: z.boolean().optional(),
    observacao: z.string().optional(),
  })).optional(),
});

export type DiagnosticoTecnico = z.infer<typeof DiagnosticoTecnicoSchema>;

// --- Processo (contexto para geração de documentos) ---

export const ProcessoContextoSchema = z.object({
  id: z.string(),
  tipo: z.string().optional(), // licenca, outorga, intervencao, etc.
  orgao: z.string().optional(),
  empreendimento: EmpreendimentoResumoSchema,
  local: LocalSchema.optional(),
  diagnostico: DiagnosticoTecnicoSchema.optional(),
  estudosSolicitados: z.array(z.string()).optional(), // ex: ['RCA', 'EIA/RIMA']
});

export type ProcessoContexto = z.infer<typeof ProcessoContextoSchema>;
