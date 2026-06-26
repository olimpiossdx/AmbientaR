import type { PeaProgramStatus } from '@/lib/pea/types';

export const PEA_STATUS_LABEL: Record<PeaProgramStatus, string> = {
  Rascunho: 'Rascunho',
  'Em elaboração': 'Em elaboração',
  Aprovado: 'Aprovado',
  'Em execução': 'Em execução',
  Arquivado: 'Arquivado',
};

export const DISPENSA_STATUS_LABEL: Record<string, string> = {
  Rascunho: 'Rascunho',
  Enviado: 'Enviado',
  Aprovado: 'Aprovado',
  Indeferido: 'Indeferido',
};

export const FASES_LICENCIAMENTO = [
  'Licença Prévia - LP',
  'Licença de Instalação - LI',
  'Licença de Operação - LO',
  'Licença de Renovação de Instalação',
  'Licença de Renovação de Operação',
  'Licença de Instalação Corretiva - LIC',
  'Licença de Operação Corretiva - LOC',
  'Licença Prévia e de Instalação Concomitantes - LP+LI',
  'Licença de Instalação e Operação Concomitantes - LI+LO',
  'Licença Prévia, de Instalação e Operação Concomitantes - LP+LI+LO',
] as const;

export const DISPENSA_PARCIAL_OPTIONS = [
  { id: 'publico_interno_instalacao', label: 'Público-alvo interno, durante a instalação do empreendimento' },
  { id: 'publico_interno_operacao', label: 'Público-alvo interno, durante a operação do empreendimento' },
  { id: 'publico_externo_instalacao', label: 'Público-alvo externo, durante a instalação do empreendimento' },
  { id: 'publico_externo_operacao', label: 'Público-alvo externo, durante a operação do empreendimento' },
  { id: 'dsp_flutuante', label: 'Diagnóstico Socioambiental Participativo - DSP para o público flutuante' },
  { id: 'revisao_pea_licenca', label: 'Revisão e/ou complementação do PEA para a obtenção de licença ambiental' },
] as const;

export function newPeaProjetoId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newPeaMonitoramentoId(): string {
  return `mon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newDspTecnicaId(): string {
  return `dsp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newCampoExtraId(): string {
  return `extra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
