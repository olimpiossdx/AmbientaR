import React from "react";

export type ToastType = "success" | "error" | "info" | "warning" | "custom";
export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
export type ToastSize = "normal" | "large";

export interface IToastAction {
 label: string;
 onClick: () => void;
 closeOnClick?: boolean;
}

export interface IToastOptions {
 id?: string;
 title?: React.ReactNode;
 duration?: number;
 position?: ToastPosition;
 icon?: React.ReactNode;
 size?: ToastSize;
 action?: IToastAction;
 dismissible?: boolean;
 className?: string;
}

export interface IToast extends Omit<IToastOptions, "id"> {
 id: string;
 type: ToastType;
 message: React.ReactNode;
 createdAt: number;
}

export interface ToastHandle {
 id: string;
 dismiss: () => void;
 update: (options: Partial<IToast>) => void;
}
