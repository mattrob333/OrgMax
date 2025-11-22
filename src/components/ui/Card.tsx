import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div
      className={[
        // Shape
        'rounded-3xl border',
        // Surface
        'border-white/10 bg-white/5 backdrop-blur-2xl',
        // Depth
        'shadow-[0_18px_45px_rgba(0,0,0,0.7)] shadow-[0_0_22px_rgba(196,248,42,0.18)]',
        // Spacing
        'p-8',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
