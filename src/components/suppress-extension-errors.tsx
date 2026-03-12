'use client';

import { useEffect } from 'react';

/**
 * Evita que erros não tratados vindos de extensões do navegador (ex.: MetaMask)
 * disparem o overlay de erro do React. O AmbientaR não usa carteiras ou Web3.
 */
export function SuppressExtensionErrors() {
  useEffect(() => {
    const isFromExtension = (message: string, source?: string, stack?: string) => {
      const str = [message, source, stack].filter(Boolean).join(' ');
      return /chrome-extension:\/\//i.test(str) || /metamask/i.test(str) || /Failed to connect to MetaMask/i.test(str);
    };

    const onError = (event: ErrorEvent) => {
      if (isFromExtension(event.message, event.filename, event.error?.stack)) {
        event.preventDefault();
        return true;
      }
      return false;
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message ?? '';
      const stack = reason?.stack ?? '';
      if (isFromExtension(msg, undefined, stack)) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
