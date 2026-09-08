'use client';

import { FolderOpen } from 'lucide-react';

type BrandLogoProps = {
  /**
   * 'sm' → compact icon-only brand mark (header bars)
   * 'md' → full logo: gradient icon + "DMS" wordmark + subtitle (login/sidebar)
   */
  size?: 'sm' | 'md';
  /**
   * 'light' → for light backgrounds (dark text)
   * 'dark'  → for dark backgrounds (light text)
   */
  variant?: 'light' | 'dark';
  /** Subtitle shown under the "DMS" wordmark (md size only). */
  subtitle?: string;
  className?: string;
};

const ICON_BOX_CLASS =
  'flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30';

export function BrandLogo({
  size = 'md',
  variant = 'light',
  subtitle = 'ລະບົບເອກກະສານ',
  className = '',
}: BrandLogoProps) {
  return (
    <div
      className={`flex items-center ${size === 'md' ? 'gap-3' : ''} ${className}`}
    >
      <div
        className={`${ICON_BOX_CLASS} ${
          size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-11 w-11 rounded-xl'
        }`}
        aria-hidden="true"
      >
        <FolderOpen className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>

      {size === 'md' && (
        <div className="min-w-0">
          <div
            className={`text-sm font-bold tracking-tight ${
              variant === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            DMS
          </div>
          <div
            className={`text-[11px] font-medium tracking-wide ${
              variant === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}