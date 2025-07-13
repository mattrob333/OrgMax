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
  className 
}: BadgeProps) {
  const baseClasses = "inline-flex items-center justify-center font-bold text-white rounded-full"
  
  const variants = {
    default: "bg-purple-500",
    destructive: "bg-red-500",
    warning: "bg-yellow-500",
    success: "bg-green-500"
  }
  
  const sizes = {
    sm: "h-4 w-4 text-xs",
    md: "h-5 w-5 text-xs"
  }
  
  return (
    <span className={cn(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  )
} 