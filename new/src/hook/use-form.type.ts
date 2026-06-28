import type { ValidationConfig } from "./use-validation.type";
import type { Path, PathValue } from "../utils/path";
import type { ApiResponse } from "../service/http/types";

/**
 * Regra de validação associada a um campo do formulário.
 * @template T - Tipo do modelo completo do formulário.
 */
export type ValidationRule<T> = {
  /**
   * Função que executa a validação.
   * @param value - Valor atual do campo.
   * @param formData - Objeto com todos os dados do formulário.
   * @returns `true` se o valor for válido, `false` caso contrário.
   */
  validate: (value: unknown, formData: T) => boolean;
  /** Mensagem de erro exibida quando a validação falha. */
  message: string;
};

/**
 * Esquema de validação que mapeia campos do modelo para suas regras.
 * Cada chave é opcional – apenas campos com regras precisam ser declarados.
 * @template T - Tipo do modelo completo do formulário.
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

/**
 * Objeto contendo os erros de validação, mapeando campos para suas mensagens.
 * @template T - Tipo do modelo completo do formulário.
 */
export type FormErrors<T> = {
  [K in keyof T]?: string[];
};

/**
 * Callback executado quando o formulário é submetido com sucesso.
 * Pode ser síncrono ou assíncrono.
 * @template T - Tipo do modelo extraído do formulário.
 */
export type FormSubmitResult<TResult = void> = void | ApiResponse<TResult>;

export type FormSubmitCallback<T, TResult = void> = (
  model: T,
  event: React.SubmitEvent<HTMLFormElement>,
) => FormSubmitResult<TResult> | Promise<FormSubmitResult<TResult>>;

/**
 * Propriedades aceitas pelo hook `useForm`.
 * @template T - Tipo do modelo do formulário (padrão: `Record<string, unknown>`).
 */
export interface IUseFormProps<T = Record<string, unknown>, TResult = void> {
  /** Valores iniciais para popular o formulário (opcional). */
  model?: Partial<T>;
  /** ID do elemento `<form>` no DOM. */
  id: string;
  /** Configuração de validação opcional. */
  validation?: ValidationConfig<T>;
  /** Função chamada no evento submit, após prevenção do comportamento padrão. */
  onSubmit: FormSubmitCallback<T, TResult>;
}

/**
 * Tipos de elementos de formulário nativos suportados pelo hook.
 */
export type FormFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Retorno público do hook `useForm`.
 *
 * A tipagem forte de `getFieldValue` e `setFieldValue` fornece autocomplete dos campos
 * e validação do valor aceito por cada caminho do modelo.
 */
export interface UseFormReturn<TModel = Record<string, unknown>> {
  formProps: {
    id: string;
    ref: React.RefCallback<HTMLFormElement>;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
  };
  submit: () => void;
  reset: () => void;
  /** Restaura um campo isolado para o baseline atual. */
  resetField: <P extends Path<TModel>>(path: P) => void;
  /** Restaura todos os campos de uma seção para o baseline atual. */
  resetSection: <P extends Path<TModel>>(path: P) => void;
  /** Atualiza o baseline usado por reset(). Sem argumento, usa getModel(). */
  commit: (model?: Partial<TModel> | TModel) => void;
  validate: () => Promise<boolean>;
  /** Valida manualmente um único campo pelo atributo name. */
  validateField: <P extends Path<TModel>>(path: P) => Promise<boolean>;
  /** Valida manualmente os campos de uma seção pelo prefixo do path. */
  validateScope: <P extends Path<TModel>>(path: P) => Promise<boolean>;
  clearErrors: () => void;
  getModel: () => TModel | null;
  getFieldValue: <P extends Path<TModel>>(path: P) => PathValue<TModel, P> | null;
  setFieldValue: <P extends Path<TModel>>(path: P, value: PathValue<TModel, P>) => void;
  isValidating: boolean;
}

/**
 * Tipos suportados para valores dentro do modelo de formulário.
 * Inclui primitivos, arquivos, arrays e objetos aninhados.
 * Usado principalmente no parser de dados (`path-parse`).
 */
export type ModelValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | ModelValue[]
  | { [key: string]: ModelValue };

/**
 * Tipo genérico para valores aninhados (sem `File`).
 * Útil para representar estruturas de dados que não manipulam arquivos diretamente.
 */
export type NestedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | NestedValue[]
  | { [key: string]: NestedValue };

/**
 * Objeto genérico cujas chaves são strings e os valores seguem a estrutura de `NestedValue`.
 */
export type NestedObject = Record<string, NestedValue>;
