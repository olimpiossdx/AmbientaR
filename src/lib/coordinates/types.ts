/** Componentes GMS (grau, minuto, segundo) como digitados no formulário. */
export type DmsComponents = {
  grau?: string | number;
  min?: string | number;
  seg?: string | number;
};

export type CoordinateValidationIssue = {
  field: string;
  message: string;
};
