import type { IToast } from "./types.toast";

type Listener = (toasts: IToast[]) => void;

class ToastManager {
 private toasts: IToast[] = [];
 private listeners = new Set<Listener>();

 subscribe(listener: Listener) {
  this.listeners.add(listener);
  listener([...this.toasts]);

  return () => {
   this.listeners.delete(listener);
  };
 }

 private notify() {
  const snapshot = [...this.toasts];
  this.listeners.forEach((listener) => listener(snapshot));
 }

 add(toast: IToast, options?: { maxToasts?: number }) {
  const maxToasts = options?.maxToasts ?? 6;
  const nextToasts = [...this.toasts, toast];

  this.toasts = nextToasts.length > maxToasts ? nextToasts.slice(nextToasts.length - maxToasts) : nextToasts;
  this.notify();
 }

 update(id: string, patch: Partial<IToast>) {
  this.toasts = this.toasts.map((toast) => toast.id === id ? { ...toast, ...patch, id: toast.id, createdAt: toast.createdAt } : toast);
  this.notify();
 }

 remove(id: string) {
  if (!this.toasts.some((toast) => toast.id === id)) {
   return;
  }

  this.toasts = this.toasts.filter((toast) => toast.id !== id);
  this.notify();
 }

 clear() {
  if (this.toasts.length === 0) {
   return;
  }

  this.toasts = [];
  this.notify();
 }

 getSnapshot() {
  return [...this.toasts];
 }
}

export const toastManager = new ToastManager();
