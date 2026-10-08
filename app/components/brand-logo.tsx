'use client';

import Image from 'next/image';

type BrandLogoProps = {
  /**
   * 'sm' → compact icon-only brand mark (header bars)
   * 'md' → full logo: samurai icon + "DMS" wordmark + subtitle (login/sidebar)
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

export function BrandLogo({
  size = 'md',
  variant = 'light',
  subtitle = 'ລະບົບເອກກະສານ',
  className = '',
}: BrandLogoProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex items-center ${size === 'md' ? 'gap-3' : ''} ${className}`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-all ${
          size === 'sm' ? 'h-9 w-9 p-0.5' : 'h-11 w-11 p-1'
        } ${
          isDark
            ? 'border-slate-800 bg-white shadow-md shadow-black/20'
            : 'border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5'
        }`}
        aria-hidden="true"
      >
        <Image
          src="/logo.png"
          alt="Logo"
          width={size === 'sm' ? 36 : 44}
          height={size === 'sm' ? 36 : 44}
          className="h-full w-full object-contain"
          priority
        />
      </div>

      {size === 'md' && (
        <div className="min-w-0">
          <div
            className={`text-sm font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            DMS
          </div>
          <div
            className={`text-[11px] font-medium tracking-wide ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}