/**
 * Aurora Background Component
 * Design System: Linear-inspired Dark Theme
 * 대시보드와 동일한 Aurora 효과를 제공하는 공통 컴포넌트
 */

import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'subtle' | 'vibrant'
}

export function AuroraBackground({
  children,
  className,
  variant = 'default',
}: AuroraBackgroundProps) {
  const variants = {
    default: {
      primary: 'bg-[#5E6AD2]/5',
      secondary: 'bg-emerald-500/5',
      tertiary: 'bg-amber-500/3',
    },
    subtle: {
      primary: 'bg-[#5E6AD2]/3',
      secondary: 'bg-emerald-500/3',
      tertiary: 'bg-amber-500/2',
    },
    vibrant: {
      primary: 'bg-[#5E6AD2]/8',
      secondary: 'bg-emerald-500/8',
      tertiary: 'bg-amber-500/5',
    },
  }

  const colors = variants[variant]

  return (
    <div className={cn('relative min-h-screen bg-[#0D0D0F]', className)}>
      {/* Aurora Background Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className={cn(
            'absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl',
            colors.primary
          )}
        />
        <div
          className={cn(
            'absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl',
            colors.secondary
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl',
            colors.tertiary
          )}
        />
      </div>
      {children}
    </div>
  )
}

/**
 * Glass Morphism Card
 * Aurora 배경 위에 사용되는 Glass 효과 카드
 */
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function GlassCard({
  children,
  className,
  padding = 'md',
}: GlassCardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-xl shadow-2xl',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
