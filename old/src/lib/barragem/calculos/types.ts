/** Resultado padronizado de cálculo de barragem (manual §26.1). */
export type BarragemCalculoStatus = 'calculado' | 'atende' | 'nao_atende' | 'revisar';

export type BarragemCalculoResult<T extends Record<string, number>> = {
  input: Record<string, number>;
  formula: string;
  steps: string[];
  result: T;
  criteria?: Record<string, unknown>;
  status: BarragemCalculoStatus;
  warnings: string[];
};
