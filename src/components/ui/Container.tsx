import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function Container({ children, className = '' }: Props) {
  return (
    <div className={`max-w-7xl mx-auto px-6 ${className}`}>{children}</div>
  )
} 