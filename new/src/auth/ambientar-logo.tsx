
import { Leaf } from 'lucide-react';
import { cn } from '../utils/utils';

type AmbientaRLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  href?: string;
  className?: string;
  /** Inverte cores do wordmark para fundos escuros (hero). */
  variant?: 'default' | 'onDark';
};

const iconSizes = {
  sm: { box: 'h-9 w-9 rounded-xl', leaf: 'h-5 w-5' },
  md: { box: 'h-12 w-12 rounded-2xl', leaf: 'h-7 w-7' },
  lg: { box: 'h-[72px] w-[72px] rounded-3xl', leaf: 'h-10 w-10' },
} as const;

const titleSizes = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-[2.65rem]',
} as const;

export function AmbientaRLogo({
  size = 'md',
  showWordmark = false,
  href,
  className,
  variant = 'default',
}: AmbientaRLogoProps) {
  const { box, leaf } = iconSizes[size];
  const onDark = variant === 'onDark';

  const content = (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground shadow-sm',
          box,
        )}
      >
        <Leaf className={leaf} aria-hidden />
      </div>
      {showWordmark && (
        <div className="min-w-0 text-left">
          <span
            className={cn(
              'block font-bold leading-none tracking-tight',
              titleSizes[size],
              onDark ? 'text-white' : 'text-primary',
            )}
          >
            AmbientaR
          </span>
          <span
            className={cn(
              'mt-1.5 block text-base font-medium',
              onDark ? 'text-emerald-100/90' : 'text-muted-foreground',
            )}
          >
            Gestão Ambiental Inteligente
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {content}
      </a>
    );
  }

  return content;
}
