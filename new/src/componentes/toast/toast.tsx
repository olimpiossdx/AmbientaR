import React from "react";
import { createRoot, type Root } from "react-dom/client";

import ToastContainer from "./container";
import { toastManager } from "./manager";
import type { IToast, IToastOptions, ToastHandle, ToastType } from "./types.toast";
import { createInstanceId } from "../../utils/object";

const CONTAINER_ID = "hybrid-toast-portal";

let root: Root | null = null;
let containerElement: HTMLDivElement | null = null;

const ensureContainerExists = () => {
 if (typeof document === "undefined") {
  return false;
 }

 if (root && containerElement && document.body.contains(containerElement)) {
  return true;
 }

 const existingContainer = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
 containerElement = existingContainer ?? document.createElement("div");
 containerElement.id = CONTAINER_ID;

 if (!existingContainer) {
  document.body.appendChild(containerElement);
 }

 root = createRoot(containerElement);
 root.render(React.createElement(ToastContainer));

 return true;
};

const createHandle = (id: string): ToastHandle => ({
 id,
 dismiss: () => toastManager.remove(id),
 update: (options) => toastManager.update(id, options),
});

const dispatch = (type: ToastType, message: React.ReactNode, options?: IToastOptions): ToastHandle => {
 const canRender = ensureContainerExists();
 const id = options?.id ?? createInstanceId();
 const toast: IToast = {
  id,
  type,
  message,
  title: options?.title,
  duration: options?.duration,
  action: options?.action,
  position: options?.position,
  icon: options?.icon,
  size: options?.size,
  dismissible: options?.dismissible,
  className: options?.className,
  createdAt: Date.now(),
 };

 if (canRender) {
  toastManager.add(toast);
 }

 return createHandle(id);
};

export const toast = {
 success: (message: React.ReactNode, options?: IToastOptions) => dispatch("success", message, options),
 error: (message: React.ReactNode, options?: IToastOptions) => dispatch("error", message, options),
 warning: (message: React.ReactNode, options?: IToastOptions) => dispatch("warning", message, options),
 info: (message: React.ReactNode, options?: IToastOptions) => dispatch("info", message, options),
 custom: (message: React.ReactNode, options?: IToastOptions) => dispatch("custom", message, options),
 dismiss: (id: string) => toastManager.remove(id),
 clear: () => toastManager.clear(),
 update: (id: string, options: Partial<IToast>) => toastManager.update(id, options),
};

export default toast;
