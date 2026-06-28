import React from "react";

export type ButtonVariant = "primary" | "primary-soft" | "secondary" | "outline" | "ghost" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ManagedActionState = {
 loading: boolean;
 disabled: boolean;
};

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: ButtonVariant;
 size?: ButtonSize;
 isLoading?: boolean;
 leftIcon?: React.ReactNode;
 rightIcon?: React.ReactNode;
 fullWidth?: boolean;
}

export const MANAGED_BUTTON_ACTION_API = Symbol.for("managed-button-action.api.v1");
export const FORM_BUTTON_API = MANAGED_BUTTON_ACTION_API;

export interface IManagedActionAPI {
 setLoading: (loading: boolean) => void;
 setDisabled: (disabled: boolean) => void;
 getState: () => ManagedActionState;
 readonly instanceId: string;
 readonly isMounted: boolean;
}

export interface IElementWithManagedActionAPI extends HTMLElement {
 [MANAGED_BUTTON_ACTION_API]?: IManagedActionAPI;
}

export interface IButtonElementWithManagedActionAPI extends HTMLButtonElement {
 [MANAGED_BUTTON_ACTION_API]?: IManagedActionAPI;
}

export type IFormButtonAPI = IManagedActionAPI;
export type IButtonElementWithFormAPI = IButtonElementWithManagedActionAPI;
