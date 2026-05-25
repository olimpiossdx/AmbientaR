/**
 * Fase 3 – Motor de Relatórios.
 * Mapeia AmbientalContext para os placeholders usados nos templates DOCX.
 * Convenção: {{NOME_CAMPO}} em MAIÚSCULAS, sem acentos (ver docs/PLACEHOLDERS-DOCX.md).
 */

import type { AmbientalContext } from '@/lib/types';
import type { GeoAnalysisComplementOutput, WaveAAnalysisResult } from '@/lib/types/geo-wave-a';
import {
  buildGeoPlaceholderData,
  mergePlaceholderData,
} from '@/lib/geospatial/geo-placeholders';

function fmt(str: string | undefined | null): string {
  return str != null && String(str).trim() !== '' ? String(str).trim() : '—';
}

function formatarEndereco(parts: (string | undefined | null)[]): string {
  const filtrado = parts.filter((p) => p != null && String(p).trim() !== '');
  return filtrado.length > 0 ? filtrado.join(', ') : '—';
}

/**
 * Gera o objeto de dados para substituição no DOCX a partir do contexto ambiental.
 * Chaves no formato esperado pelo Word: EMPREENDEDOR_NOME, EMPREENDIMENTO_MUNICIPIO, etc.
 */
export function buildPlaceholderDataFromContext(ctx: AmbientalContext): Record<string, string> {
  const e = ctx.empreendedor;
  const p = ctx.empreendimento;
  const emp = ctx.empresaAmbiental;

  const empreendedorEndereco = e
    ? formatarEndereco([e.address, e.numero, e.bairro, e.municipio, e.uf, e.cep])
    : '—';
  const empreendimentoEndereco = p
    ? formatarEndereco([p.address, p.numero, p.district, p.municipio, p.uf, p.cep])
    : '—';
  const empresaEndereco = emp
    ? formatarEndereco([emp.address, emp.numero, emp.municipio, emp.uf, emp.cep])
    : '—';

  const resumoLicencas =
    ctx.licencas.length > 0
      ? ctx.licencas
          .map(
            (l) =>
              `${l.permitType ?? 'Licença'} – Processo ${l.processNumber ?? 'N/I'}${l.expirationDate ? ` (válida até ${l.expirationDate})` : ''}`
          )
          .join('; ')
      : 'Nenhuma licença cadastrada para este empreendedor.';
  const resumoOutorgas =
    ctx.outorgas.length > 0
      ? ctx.outorgas
          .map(
            (o) =>
              `${o.permitNumber ?? 'N/I'} – ${o.description ?? 'Outorga'}${o.expirationDate ? ` (válida até ${o.expirationDate})` : ''}`
          )
          .join('; ')
      : 'Nenhuma outorga cadastrada para este empreendedor.';
  const resumoIntervencoes =
    ctx.intervencoes.length > 0
      ? ctx.intervencoes
          .map(
            (i) =>
              `${i.description ?? 'Intervenção'} – Processo ${i.processNumber ?? 'N/I'}${i.expirationDate ? ` (válida até ${i.expirationDate})` : ''}`
          )
          .join('; ')
      : 'Nenhuma intervenção ambiental cadastrada.';

  return {
    EMPREENDEDOR_NOME: fmt(e?.name),
    EMPREENDEDOR_CPF_CNPJ: fmt(e?.cpfCnpj),
    EMPREENDEDOR_ENDERECO_COMPLETO: empreendedorEndereco,
    EMPREENDEDOR_MUNICIPIO: fmt(e?.municipio),
    EMPREENDEDOR_UF: fmt(e?.uf),
    EMPREENDEDOR_EMAIL: fmt(e?.email),
    EMPREENDEDOR_TELEFONE: fmt(e?.phone),

    EMPREENDIMENTO_NOME: fmt(p?.propertyName),
    EMPREENDIMENTO_ATIVIDADE: fmt(p?.activity),
    EMPREENDIMENTO_MUNICIPIO: fmt(p?.municipio),
    EMPREENDIMENTO_UF: fmt(p?.uf),
    EMPREENDIMENTO_ENDERECO: empreendimentoEndereco,

    EMPRESA_AMBIENTAL_RAZAO_SOCIAL: fmt(emp?.name),
    EMPRESA_AMBIENTAL_CNPJ: fmt(emp?.cnpj),
    EMPRESA_AMBIENTAL_ENDERECO: empresaEndereco,

    RESUMO_LICENCAS_VIGENTES: resumoLicencas,
    RESUMO_OUTORGAS: resumoOutorgas,
    RESUMO_INTERVENCOES: resumoIntervencoes,

    BLOCO_ENQUADRAMENTO_LEGAL: '',
    BLOCO_DESCRICAO_PROJETO: '',
    BLOCO_MEIO_FISICO: '',
    BLOCO_MEIO_BIOTICO_FLORA: '',
    BLOCO_MEIO_BIOTICO_FAUNA: '',
    BLOCO_MEIO_SOCIOECONOMICO: '',
    BLOCO_IMPACTOS_AMBIENTAIS: '',
    BLOCO_MEDIDAS_MITIGADORAS: '',
    BLOCO_PROGRAMAS_AMBIENTAIS: '',
    BLOCO_CONCLUSAO_TECNICA: '',
  };
}

/** Contexto + análise SIG (Passo 3) para geração de DOCX de laudos/RCA. */
export function buildPlaceholderDataForLaudo(
  ctx: AmbientalContext,
  geo?: {
    wave: WaveAAnalysisResult;
    complement?: GeoAnalysisComplementOutput | null;
  },
): Record<string, string> {
  const base = buildPlaceholderDataFromContext(ctx);
  if (!geo) return base;
  return mergePlaceholderData(base, buildGeoPlaceholderData(geo.wave, geo.complement));
}
