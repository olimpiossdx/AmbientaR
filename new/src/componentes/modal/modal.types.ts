import React from 'react';

export type ModalSize =
 | 'sm'
 | 'md'
 | 'lg'
 | 'xl'
 | '2xl'
 | '3xl'
 | 'full'
 | 'custom';

export type ModalSlotProps = {
 close: () => void;
 onClose: () => void;
};

export type ModalSlot<P = Record<string, never>> =
 | React.ReactNode
 | React.ComponentType<P & ModalSlotProps>;

export interface ModalClassNames {
 overlay?: string;
 panel?: string;
 header?: string;
 title?: string;
 description?: string;
 content?: string;
 footer?: string;
 closeButton?: string;
}

export interface IModalOptions<
 H = Record<string, never>,
 C = Record<string, never>,
 A = Record<string, never>,
> {
 title?: ModalSlot<H>;
 description?: React.ReactNode;
 content: ModalSlot<C>;
 actions?: ModalSlot<A>;
 footer?: ModalSlot<A>;

 props?: {
  title?: H;
  content?: C;
  actions?: A;
  footer?: A;
 };

 size?: ModalSize;
 hideCloseButton?: boolean;
 closeOnEscape?: boolean;
 closeOnBackdropClick?: boolean;
 classNames?: ModalClassNames;
 styleConfig?: React.CSSProperties;
 onClose?: () => void;
}

export type ModalBaseProps = {
 open?: boolean;
 onClose: () => void;
 title?: ModalSlot<any>;
 description?: React.ReactNode;
 children?: ModalSlot<any>;
 footer?: ModalSlot<any>;
 size?: ModalSize;
 hideCloseButton?: boolean;
 closeOnEscape?: boolean;
 closeOnBackdropClick?: boolean;
 classNames?: ModalClassNames;
 styleConfig?: React.CSSProperties;
 registerCloseAnimation?: (trigger: () => void) => void;
};

export type ModalOptionsProps = {
 options: IModalOptions<any, any, any>;
 onClose: () => void;
 registerCloseAnimation?: (trigger: () => void) => void;
};

export type IModalProps = ModalBaseProps | ModalOptionsProps;
