import React from 'react';

export type PopoverAlign = 'start' | 'center' | 'end';
export type PopoverSide = 'top' | 'bottom';

export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  /** API atual: trigger declarativo renderizado pelo próprio Popover. */
  trigger?: React.ReactNode;
  /** API evoluída/legada: ancora o popover em um elemento externo. */
  triggerRef?: React.RefObject<HTMLElement | null> | React.RefObject<any>;

  /** API atual controlada. */
  open?: boolean;
  /** API atual não-controlada. */
  defaultOpen?: boolean;
  /** API atual de mudança de estado. */
  onOpenChange?: (open: boolean) => void;

  /** @deprecated Use open. Mantido para compatibilidade com a API antiga. */
  isOpen?: boolean;
  /** @deprecated Use onOpenChange. Mantido para compatibilidade com a API antiga. */
  onClose?: () => void;

  align?: PopoverAlign;
  side?: PopoverSide;
  sideOffset?: number;

  /** Renderiza em document.body e habilita cálculo de colisão/posicionamento. */
  portal?: boolean;
  /** Define min-width igual à largura do trigger/âncora. */
  fullWidth?: boolean;
  /** Fecha quando clicar fora do trigger e do conteúdo. */
  closeOnOutsideClick?: boolean;
  /** Classe aplicada somente ao botão interno quando trigger é usado. */
  triggerClassName?: string;

  children: React.ReactNode;
}
