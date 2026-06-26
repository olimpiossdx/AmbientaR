'use client';

import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

/**
 * Em ambiente de preview (iframe, ex.: navegador embutido do Cursor),
 * o App Router do Next.js pode falhar com "expected layout router to be mounted".
 * Este componente detecta iframe e sugere abrir em aba normal.
 */
export function IframeRedirectBanner() {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(typeof window !== 'undefined' && window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  if (!isInIframe) return null;

  const url = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-6 text-center">
      <Leaf className="mb-4 h-12 w-12 text-primary" />
      <h1 className="text-xl font-semibold text-foreground">
        Abra em um navegador
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        O preview embutido pode causar erros. Para usar o AmbientaR, abra o link abaixo
        em uma nova aba do Chrome, Edge ou Firefox.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Abrir em nova aba
      </a>
    </div>
  );
}
