"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FadImageCompareSliderProps = {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
};

export function FadImageCompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  className,
}: FadImageCompareSliderProps) {
  const [position, setPosition] = React.useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  const updateFromClientX = React.useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateFromClientX]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={containerRef}
        className="relative aspect-video w-full select-none overflow-hidden rounded-md border bg-muted touch-none"
        onPointerDown={(e) => {
          dragging.current = true;
          updateFromClientX(e.clientX);
        }}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Comparar imagens antes e depois"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt={beforeLabel} className="h-full w-full object-cover" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]"
          style={{ left: `${position}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          ↔
        </div>
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {afterLabel}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="w-full"
        aria-label="Posição do comparador"
      />
    </div>
  );
}
