import React, { type InputHTMLAttributes } from "react";

import type { IHelperTextApi, HelperVariant } from "../helper-text";
import type {
  CreateMaskOptions,
  InputMaskApi,
  MaskDefinition,
  MaskResult,
} from "../../utils/mask-builder";

export type InputMaskChangeHandler = (
  event: React.ChangeEvent<HTMLInputElement>,
  payload: MaskResult,
) => void;

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: React.ReactNode;
  name: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  helperClassName?: string;
  helperText?: React.ReactNode;
  helperStatus?: HelperVariant;
  variant?: "outlined" | "filled" | "ghost";
  sized?: "sm" | "md" | "lg";
  floatingLabel?: boolean;
  showPasswordToggle?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

export type IInputProps =
  | (BaseInputProps & {
      mask?: undefined;
      maskOptions?: never;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
    })
  | (BaseInputProps & {
      mask: MaskDefinition;
      maskOptions?: CreateMaskOptions;
      onChange?: InputMaskChangeHandler;
    });

export interface IInputApi extends HTMLInputElement {
  helperText?: IHelperTextApi;
  mask?: InputMaskApi;
}
