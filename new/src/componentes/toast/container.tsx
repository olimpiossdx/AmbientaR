import React from 'react';
import {
 AlertCircle,
 AlertTriangle,
 CheckCircle,
 Info,
 Star,
 X,
} from 'lucide-react';
import { cn } from '@sglara/cn';

import { toastManager } from './manager';
import type { IToast, ToastPosition, ToastType } from './types.toast';

const TOAST_Z_INDEX_CLASS = 'z-[999999]';
const TOAST_ANIMATION_MS = 300;

const positions: ToastPosition[] = [
 'top-right',
 'top-left',
 'bottom-right',
 'bottom-left',
 'top-center',
 'bottom-center',
];

const getPositionClasses = (position: ToastPosition) => {
 const base = cn(
  'fixed flex flex-col gap-3 p-4 pointer-events-none max-h-screen overflow-hidden',
  TOAST_Z_INDEX_CLASS,
 );

 switch (position) {
  case 'top-right':
   return cn(base, 'top-0 right-0 items-end');
  case 'top-left':
   return cn(base, 'top-0 left-0 items-start');
  case 'bottom-right':
   return cn(base, 'bottom-0 right-0 items-end flex-col-reverse');
  case 'bottom-left':
   return cn(base, 'bottom-0 left-0 items-start flex-col-reverse');
  case 'top-center':
   return cn(base, 'top-0 left-1/2 -translate-x-1/2 items-center');
  case 'bottom-center':
   return cn(base, 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse');
 }
};

const getExitClasses = (position: ToastPosition) => {
 if (position.includes('left')) {
  return 'opacity-0 scale-95 -translate-x-4';
 }

 if (position.includes('right')) {
  return 'opacity-0 scale-95 translate-x-4';
 }

 if (position.includes('bottom')) {
  return 'opacity-0 scale-95 translate-y-4';
 }

 return 'opacity-0 scale-95 -translate-y-4';
};

const getAriaLive = (type: ToastType) => {
 return type === 'error' || type === 'warning' ? 'assertive' : 'polite';
};

const getRole = (type: ToastType) => {
 return type === 'error' || type === 'warning' ? 'alert' : 'status';
};

const ToastContainer = () => {
 const [toasts, setToasts] = React.useState<IToast[]>([]);

 React.useEffect(() => {
  return toastManager.subscribe(setToasts);
 }, []);

 return (
  <>
   {positions.map((position) => (
    <div
     key={position}
     className={getPositionClasses(position)}
     aria-live={position.includes('top') ? 'polite' : undefined}
    >
     {toasts
      .filter((toast) => (toast.position ?? 'top-right') === position)
      .map((toast) => (
       <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
   ))}
  </>
 );
};

const ToastItem = ({ toast }: { toast: IToast }) => {
 const [isExiting, setIsExiting] = React.useState(false);

 const closeStartedRef = React.useRef(false);
 const removeTimeoutRef = React.useRef<number | null>(null);

 const position = toast.position ?? 'top-right';
 const duration = toast.duration ?? 4000;
 const isLarge = toast.size === 'large';
 const isDismissible = toast.dismissible ?? true;

 const handleClose = React.useCallback(() => {
  if (closeStartedRef.current) {
   return;
  }

  closeStartedRef.current = true;
  setIsExiting(true);

  removeTimeoutRef.current = window.setTimeout(() => {
   toastManager.remove(toast.id);
  }, TOAST_ANIMATION_MS);
 }, [toast.id]);

 React.useEffect(() => {
  if (duration === Infinity) {
   return;
  }

  const timer = window.setTimeout(handleClose, duration);

  return () => {
   window.clearTimeout(timer);

   if (removeTimeoutRef.current !== null) {
    window.clearTimeout(removeTimeoutRef.current);
   }
  };
 }, [duration, handleClose]);

 const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="text-emerald-500" size={24} />,
  error: <AlertCircle className="text-rose-500" size={24} />,
  warning: <AlertTriangle className="text-amber-500" size={24} />,
  info: <Info className="text-sky-500" size={24} />,
  custom: toast.icon ?? <Star className="text-violet-500" size={24} />,
 };

 const borderColors: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-rose-500',
  warning: 'border-l-amber-500',
  info: 'border-l-sky-500',
  custom: 'border-l-violet-500',
 };

 return (
  <div
   role={getRole(toast.type)}
   aria-live={getAriaLive(toast.type)}
   className={cn(
    'pointer-events-auto flex items-start gap-4 rounded-xl border-l-4 shadow-xl shadow-slate-950/10',
    'transform transition-all duration-300 ease-in-out',
    'bg-white',
    'border border-slate-200',
    isLarge ? 'w-96 p-5' : 'w-80 p-4',
    borderColors[toast.type],
    isExiting
     ? getExitClasses(position)
     : 'opacity-100 scale-100 animate-in fade-in slide-in-from-bottom-2',
    toast.className,
   )}
  >
   <div className="shrink-0 mt-0.5" aria-hidden="true">
    {icons[toast.type]}
   </div>

   <div className="flex-1 min-w-0">
    {toast.title && (
     <h4
      className={cn(
       'mb-1 font-semibold text-slate-950',
       isLarge ? 'text-lg' : 'text-sm',
      )}
     >
      {toast.title}
     </h4>
    )}

    <div
     className={cn(
      'leading-relaxed text-slate-600',
      isLarge ? 'text-base' : 'text-sm',
     )}
    >
     {toast.message}
    </div>

    {toast.action && (
     <button
      type="button"
      onClick={(event) => {
       event.stopPropagation();
       toast.action?.onClick();

       if (toast.action?.closeOnClick ?? true) {
        handleClose();
       }
      }}
      className={cn(
       'mt-3 text-xs font-bold px-3 py-1.5 rounded transition-colors',
       'uppercase tracking-wide',
       'bg-slate-100',
       'hover:bg-slate-200',
       'text-slate-800',
      )}
     >
      {toast.action.label}
     </button>
    )}
   </div>

   {isDismissible && (
    <button
     type="button"
     onClick={handleClose}
     className="text-slate-400 hover:text-slate-600 shrink-0 -mt-1 -mr-1 p-1 transition-colors"
     aria-label="Fechar notificação"
    >
     <X size={16} aria-hidden="true" />
    </button>
   )}
  </div>
 );
};

export default ToastContainer;