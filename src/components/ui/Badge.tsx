import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-full tracking-wide'

  const variants = {
    default: 'bg-[var(--orb-purple)] text-slate-950', // neon lime pill
    destructive: 'bg-red-500 text-white',
    warning: 'bg-yellow-400 text-slate-950',
    success: 'bg-emerald-500 text-slate-950',
  }

  const sizes = {
    sm: 'h-4 px-2 text-[10px]',
    md: 'h-5 px-2.5 text-xs',
  }

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
