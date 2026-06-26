import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppBootSplashProps = {
  className?: string;
};

/** Splash mínimo de arranque: só o ícone folha do AmbientaR, sem mensagens técnicas. */
export function AppBootSplash({ className }: AppBootSplashProps) {
  return (
    <div
      className={cn(
        'flex h-screen w-full items-center justify-center bg-background',
        className,
      )}
    >
      <Leaf
        className="h-12 w-12 animate-pulse text-primary"
        aria-hidden
      />
      <span className="sr-only">Carregando</span>
    </div>
  );
}
