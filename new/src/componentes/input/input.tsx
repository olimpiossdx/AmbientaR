import React from "react";
import { Eye, EyeOff } from "lucide-react";

import HelperText, { type IHelperTextApi } from "../helper-text";
import { cn } from "@sglara/cn";
import type { IInputApi, IInputProps, InputMaskChangeHandler } from "./propTypes.input";
import { applyMask, createMask, type InputMaskApi, resolveMask, } from "../../utils/mask-builder";
import { FLOATING_LABEL_ACTIVE_STYLES, SIZE_CLASSES, STATUS_CLASSES, VARIANT_CLASSES, } from "./styles";

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

const Input = React.forwardRef<IInputApi, IInputProps>(
  (
    {
      label,
      type = "text",
      className,
      containerClassName,
      helperClassName,
      helperText,
      helperStatus = "info",
      leftIcon,
      rightIcon,
      variant = "outlined",
      sized = "md",
      floatingLabel = false,
      placeholder,
      showPasswordToggle,
      showPasswordLabel = "Mostrar senha",
      hidePasswordLabel = "Ocultar senha",
      mask,
      maskOptions,
      onChange,
      onInvalid,
      onInput,
      onAnimationEnd,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const inputId = props.id ?? `${props.name}-${reactId}`;
    const helperId = `${inputId}-helper`;
    const internalInputRef = React.useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

    const isPasswordType = type === "password";
    const isCheckOrRadio = type === "checkbox" || type === "radio";
    const shouldUseMask = Boolean(mask) && !isCheckOrRadio && !isPasswordType && type !== "file";

    const maskController = React.useMemo(() => (shouldUseMask && mask ? createMask(mask, maskOptions) : null),
      [mask, maskOptions, shouldUseMask]);

    const attachMaskApi = React.useCallback((element: HTMLInputElement | null) => {
      if (!element) {
        return;
      }

      const input = element as IInputApi;

      if (!maskController) {
        delete input.mask;
        return;
      }

      const maskApi: InputMaskApi = {
        apply: (value?: unknown) => maskController.apply(value),
        remove: (value?: unknown) => maskController.remove(value ?? element.value),
        getMaskedValue: () => element.value,
        getUnmaskedValue: () => maskController.remove(element.value),
        getResult: () => maskController.getResult(element.value),
        getDefinition: () => maskController.resolve(element.value),
      };

      input.mask = maskApi;
    }, [maskController]);

    const setRefs = React.useCallback((element: HTMLInputElement | null) => {
      internalInputRef.current = element;
      attachMaskApi(element);
      assignRef(ref, element as IInputApi | null);
    }, [attachMaskApi, ref]);

    React.useLayoutEffect(() => {
      attachMaskApi(internalInputRef.current);
    }, [attachMaskApi]);

    const handleAttachHelper = React.useCallback((helper: IHelperTextApi) => {
      const input = internalInputRef.current as IInputApi | null;

      if (!input) {
        return;
      }

      input.helperText = helper;
    }, []);

    const shouldShowPasswordToggle = isPasswordType && showPasswordToggle !== false;

    const handlePasswordToggle = React.useCallback(() => {
      setIsPasswordVisible((current) => !current);
    }, []);

    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      if (shouldUseMask && mask) {
        const result = applyMask(event.currentTarget.value, mask, maskOptions);
        event.currentTarget.value = result.maskedValue;
        (onChange as InputMaskChangeHandler | undefined)?.(event, result);
        return;
      }

      (onChange as React.ChangeEventHandler<HTMLInputElement> | undefined)?.(event);
    }, [mask, maskOptions, onChange, shouldUseMask]);

    const handleInvalid = React.useCallback((event: React.InvalidEvent<HTMLInputElement>) => {
      event.currentTarget.setAttribute("data-invalid", "true");
      event.currentTarget.classList.add("animate-shake");
      onInvalid?.(event);
    }, [onInvalid]);

    const handleInput = React.useCallback((event: React.InputEvent<HTMLInputElement>) => {
      if (event.currentTarget.validity.valid) {
        event.currentTarget.removeAttribute("data-invalid");
      }

      onInput?.(event);
    }, [onInput]);

    const handleAnimationEnd = React.useCallback((event: React.AnimationEvent<HTMLInputElement>) => {
      event.currentTarget.classList.remove("animate-shake");
      onAnimationEnd?.(event);
    }, [onAnimationEnd]);

    if (type === "hidden") {
      return (<input
        {...props}
        id={inputId}
        ref={setRefs}
        type="hidden"
        onChange={handleChange}
        onInvalid={handleInvalid}
        onInput={handleInput}
        onAnimationEnd={handleAnimationEnd}
        className={className}
      />);
    }

    if (isCheckOrRadio) {
      const checkOrRadioClassName = type === "checkbox"
        ? "h-4 w-4 shrink-0 cursor-pointer rounded border-input text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
        : "h-4 w-4 shrink-0 cursor-pointer border-input text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60";

      const checkOrRadioInput = (
        <input
          {...props}
          id={inputId}
          ref={setRefs}
          type={type}
          onChange={handleChange}
          onInvalid={handleInvalid}
          onInput={handleInput}
          onAnimationEnd={handleAnimationEnd}
          aria-describedby={helperText ? helperId : props["aria-describedby"]}
          className={cn(checkOrRadioClassName, className)}
        />
      );

      if (!label && !helperText) {
        return checkOrRadioInput;
      }

      return (
        <div className={cn("ui-input-container gap-1", containerClassName)}>
          <div className="flex items-start gap-2">
            {checkOrRadioInput}
            {label && (
              <label htmlFor={inputId} className="cursor-pointer text-sm font-medium leading-4 text-foreground">
                {label} {props.required && <span className="text-destructive">*</span>}
              </label>
            )}
          </div>

          <HelperText
            id={helperId}
            attach={handleAttachHelper}
            initialMessage={helperText}
            initialStatus={helperStatus}
            className={cn("pl-6", helperClassName)}
          />
        </div>
      );
    }

    let resolvedSizeClass = SIZE_CLASSES[sized];

    if (floatingLabel) {
      resolvedSizeClass = `ui-input--floating-${variant}-${sized}`;
    }

    const hasLeftContent = Boolean(leftIcon);
    const shouldOffsetFloatingLabel = floatingLabel && hasLeftContent;
    const hasRightIcon = Boolean(rightIcon);
    const hasRightContent = hasRightIcon || shouldShowPasswordToggle;
    const resolvedInputType = isPasswordType ? (isPasswordVisible ? "text" : "password") : type;
    const maskDefinition = shouldUseMask && mask ? resolveMask(mask, props.value ?? props.defaultValue ?? "") : null;

    const resolvedValue = shouldUseMask && mask && props.value !== undefined
      ? applyMask(props.value, mask, maskOptions).maskedValue
      : props.value;

    const resolvedDefaultValue = shouldUseMask && mask && props.defaultValue !== undefined
      ? applyMask(props.defaultValue, mask, maskOptions).maskedValue
      : props.defaultValue;

    const finalInputClasses = cn(
      "peer ui-input",
      VARIANT_CLASSES[variant],
      resolvedSizeClass,
      hasLeftContent && (shouldOffsetFloatingLabel ? "pl-12" : "pl-10"),
      hasRightIcon && shouldShowPasswordToggle ? "pr-16" : hasRightContent && "pr-10",
      STATUS_CLASSES.error,
      STATUS_CLASSES.warning,
      STATUS_CLASSES.info,
      STATUS_CLASSES.success,
      STATUS_CLASSES.neutral,
      floatingLabel && "placeholder-transparent",
      className,
    );

    return (<div className={cn("ui-input-container", containerClassName)}>
      {label && !floatingLabel && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label} {props.required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div className="relative flex items-center group">
        {hasLeftContent && (
          <span className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-muted-foreground pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          {...props}
          id={inputId}
          ref={setRefs}
          type={resolvedInputType}
          value={resolvedValue}
          defaultValue={resolvedDefaultValue}
          inputMode={props.inputMode ?? maskDefinition?.inputMode}
          maxLength={props.maxLength ?? maskDefinition?.maxLength}
          onChange={handleChange}
          onInvalid={handleInvalid}
          onInput={handleInput}
          onAnimationEnd={handleAnimationEnd}
          className={finalInputClasses}
          placeholder={floatingLabel && !placeholder ? " " : placeholder}
          aria-describedby={helperText ? helperId : props["aria-describedby"]}
        />

        {label && floatingLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              "absolute z-10 origin-left transition-all duration-200 pointer-events-none",
              "text-muted-foreground top-1/2 -translate-y-1/2 scale-100",
              hasLeftContent ? (shouldOffsetFloatingLabel ? "left-12" : "left-10") : "left-3",
              FLOATING_LABEL_ACTIVE_STYLES[variant],
              "peer-focus:text-primary",
              "peer-data-invalid:text-destructive peer-data-[invalid=true]:text-destructive peer-data-[validation-status=error]:text-destructive",
            )}
          >
            {label} {props.required && <span className="text-destructive">*</span>}
          </label>
        )}

        {hasRightContent && (
          <div className="absolute right-3 z-10 flex items-center gap-2 text-muted-foreground">
            {rightIcon}
            {shouldShowPasswordToggle && (
              <button
                type="button"
                onClick={handlePasswordToggle}
                className="p-1 transition-colors rounded-full focus:outline-none hover:text-foreground hover:bg-accent"
                aria-label={isPasswordVisible ? hidePasswordLabel : showPasswordLabel}
                aria-pressed={isPasswordVisible}
              >
                {isPasswordVisible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            )}
          </div>
        )}
      </div>

      <HelperText
        id={helperId}
        attach={handleAttachHelper}
        initialMessage={helperText}
        initialStatus={helperStatus}
        className={helperClassName}
      />
    </div>);
  },
);

Input.displayName = "Input";

export default Input;
