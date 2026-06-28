import React from 'react';
import { cn } from '../../utils/cn';
import type { CarouselProps } from './carousel.types';
export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(({ index, defaultIndex = 0, onIndexChange, loop, children, className, ...props }, ref) => {
  const items = React.Children.toArray(children);
  const [internal, setInternal] = React.useState(defaultIndex);
  const current = index ?? internal;
  const go = (next: number) => {
    if (!items.length) return;
    let target = next;
    if (loop) target = (next + items.length) % items.length;
    else target = Math.max(0, Math.min(items.length - 1, next));
    if (index === undefined) setInternal(target);
    onIndexChange?.(target);
  };
  return (
    <div ref={ref} role="region" aria-roledescription="carousel" aria-label={props['aria-label'] ?? 'Carrossel'} className={cn('grid gap-3', className)} {...props}>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="flex transition-transform" style={{ transform: `translateX(-${current * 100}%)` }} aria-live="polite">
          {items.map((item, i) => (
            <div key={i} className="w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${i + 1} de ${items.length}`} aria-hidden={i !== current}>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => go(current - 1)} disabled={!loop && current <= 0} className="rounded border px-3 py-1 text-sm disabled:opacity-50" aria-label="Slide anterior">Anterior</button>
        <span className="text-xs text-gray-500" aria-live="polite">{items.length ? current + 1 : 0} / {items.length}</span>
        <button type="button" onClick={() => go(current + 1)} disabled={!loop && current >= items.length - 1} className="rounded border px-3 py-1 text-sm disabled:opacity-50" aria-label="Próximo slide">Próximo</button>
      </div>
    </div>
  );
});
Carousel.displayName = 'Carousel';
