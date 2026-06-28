import React from "react";

export type AlertVariant =
 | "info"
 | "success"
 | "warning"
 | "error"
 | "neutral";

export interface IAlertProps
 extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
 /**
  * Variante semântica do alerta.
  *
  * - info: mensagem informativa
  * - success: operação concluída
  * - warning: atenção, mas não erro bloqueante
  * - error: erro ou falha relevante
  * - neutral: mensagem neutra
  */
 variant?: AlertVariant;

 /**
  * Título opcional.
  *
  * Aceita ReactNode para permitir texto, ícone, strong,
  * links ou composição futura.
  */
 title?: React.ReactNode;

 /**
  * Conteúdo principal do alerta.
  */
 children?: React.ReactNode;

 /**
  * Ícone customizado.
  *
  * - undefined: usa ícone padrão da variante
  * - ReactNode: usa o ícone informado
  * - false: remove o ícone
  */
 icon?: React.ReactNode | false;

 /**
  * Callback de fechamento.
  *
  * Quando informado, exibe o botão de fechar.
  */
 onClose?: () => void;

 /**
  * Label acessível do botão de fechar.
  *
  * @default "Fechar alerta"
  */
 closeLabel?: string;
}