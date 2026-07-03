/** Itens mínimos PSB — manual §14.1 */
export const PSB_CHECKLIST_ITENS = [
  { id: 'identificacao_empreendedor', label: 'Identificação do empreendedor' },
  { id: 'identificacao_barragem', label: 'Identificação da barragem' },
  { id: 'caracteristicas_tecnicas', label: 'Características técnicas' },
  { id: 'projeto_construido', label: 'Projeto como construído' },
  { id: 'manual_operacao', label: 'Manual de operação' },
  { id: 'plano_manutencao', label: 'Plano de manutenção' },
  { id: 'plano_inspecao', label: 'Plano de inspeção' },
  { id: 'instrumentacao', label: 'Instrumentação' },
  { id: 'classificacao_risco', label: 'Classificação de risco' },
  { id: 'dpa', label: 'Dano potencial associado' },
  { id: 'revisoes_periodicas', label: 'Revisões periódicas de segurança' },
  { id: 'registros_historicos', label: 'Registros históricos' },
  { id: 'anomalias', label: 'Registro de anomalias' },
  { id: 'medidas_corretivas', label: 'Medidas corretivas' },
  { id: 'pae', label: 'Plano de Ação de Emergência (PAE), quando aplicável' },
] as const;

/** Inspeção regular — manual §14.2 */
export const INSPECAO_CHECKLIST_ITENS = [
  { id: 'crista', label: 'Crista' },
  { id: 'talude_montante', label: 'Talude de montante' },
  { id: 'talude_jusante', label: 'Talude de jusante' },
  { id: 'vertedouro', label: 'Vertedouro' },
  { id: 'canal_descarga', label: 'Canal de descarga' },
  { id: 'tomada_agua', label: "Tomada d'água" },
  { id: 'drenos', label: 'Drenos' },
  { id: 'piezometros', label: 'Piezômetros' },
  { id: 'marcos', label: 'Marcos superficiais' },
  { id: 'surgencias', label: 'Surgências' },
  { id: 'trincas', label: 'Trincas' },
  { id: 'recalques', label: 'Recalques' },
  { id: 'erosoes', label: 'Erosões' },
  { id: 'vegetacao', label: 'Vegetação' },
  { id: 'animais', label: 'Animais escavadores' },
] as const;

export const DAM_BREAK_CENARIOS = [
  { value: 'dia_seco', label: 'Ruptura em dia seco' },
  { value: 'cheia', label: 'Ruptura com cheia' },
  { value: 'galgamento', label: 'Galgamento' },
  { value: 'piping', label: 'Piping' },
  { value: 'ruptura_parcial', label: 'Ruptura parcial' },
] as const;

export const NIVEL_ANOMALIA_OPCOES = [
  { value: 'normal', label: 'Normal — monitorar' },
  { value: 'atencao', label: 'Atenção — intensificar inspeção' },
  { value: 'alerta', label: 'Alerta — acionar RT' },
  { value: 'emergencia', label: 'Emergência — acionar PAE' },
] as const;

export const NIVEL_PAE_OPCOES = [
  { value: 'verde', label: 'Verde — operação normal' },
  { value: 'amarelo', label: 'Amarelo — anomalia sem risco imediato' },
  { value: 'laranja', label: 'Laranja — situação potencialmente perigosa' },
  { value: 'vermelho', label: 'Vermelho — ruptura iminente ou em andamento' },
] as const;

export const DPA_OPCOES = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' },
] as const;
