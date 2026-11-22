import { useId } from 'react';
import { cn } from '@/lib/utils';

export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  // Unique gradient id per instance: a hidden duplicate (e.g. the desktop sidebar on mobile) must not own the gradient.
  const gid = `mm-g-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      <path d="M17.5 10h5v7.5H30v5h-7.5V30h-5v-7.5H10v-5h7.5z" fill="#fff" />
      <circle cx="31" cy="9" r="3" fill="#fff" opacity=".85" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <div className="leading-none">
          <div className="text-[15px] font-bold tracking-tight">
            MEDMAP <span className="text-accent">3D</span>
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">Цифрлық денсаулық</div>
        </div>
      )}
    </div>
  );
}
