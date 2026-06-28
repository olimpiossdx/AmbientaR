import React from 'react';
import { cn } from '../../utils/cn';
import type { AvatarProps } from './avatar.types';
const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ src, alt = '', fallback, size = 'md', className, ...props }, ref) => {
 const [failed, setFailed] = React.useState(false);
 return <div ref={ref} className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-medium text-gray-700', sizes[size], className)} {...props}>{src && !failed ? <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} /> : fallback ?? alt.slice(0, 2).toUpperCase()}</div>;
});
Avatar.displayName = 'Avatar';
