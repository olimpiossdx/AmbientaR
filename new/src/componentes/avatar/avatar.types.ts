import type React from 'react';
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> { src?: string; alt?: string; fallback?: React.ReactNode; size?: 'sm' | 'md' | 'lg'; }
