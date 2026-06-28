import type React from 'react';
export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> { index?: number; defaultIndex?: number; onIndexChange?: (index: number) => void; loop?: boolean; }
