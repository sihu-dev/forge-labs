/**
 * Risk Disclaimer Component
 * QRY-023: 위험 고지 및 면책조항 표시 컴포넌트
 *
 * ⚠️ 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 */

'use client'

import { memo, useState } from 'react'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { DISCLAIMERS } from '@/lib/legal'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type DisclaimerType = keyof typeof DISCLAIMERS

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme'

interface RiskDisclaimerProps {
  type: DisclaimerType
  variant?: 'inline' | 'banner' | 'modal'
  dismissible?: boolean
  className?: string
}

interface RiskWarningBannerProps {
  level: RiskLevel
  title: string
  message: string
  actions?: string[]
  onAcknowledge?: () => void
  className?: string
}

interface ConsentCheckboxProps {
  consentType: string
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  required?: boolean
  className?: string
}

// ═══════════════════════════════════════════════════════════════
// Risk Disclaimer Component
// ═══════════════════════════════════════════════════════════════

export const RiskDisclaimer = memo(function RiskDisclaimer({
  type,
  variant = 'inline',
  dismissible = false,
  className = '',
}: RiskDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const disclaimer = DISCLAIMERS[type]

  if (variant === 'banner') {
    return (
      <div
        className={`
          relative bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4
          ${className}
        `}
      >
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-200 whitespace-pre-line">
              {disclaimer}
            </p>
          </div>
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Inline variant (default)
  return (
    <div
      className={`
        flex items-start gap-2 text-xs text-gray-400
        ${className}
      `}
    >
      <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p className="whitespace-pre-line">{disclaimer}</p>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════
// Risk Warning Banner
// ═══════════════════════════════════════════════════════════════

const riskLevelConfig: Record<
  RiskLevel,
  { bgColor: string; borderColor: string; textColor: string; iconColor: string }
> = {
  low: {
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-200',
    iconColor: 'text-green-500',
  },
  medium: {
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-200',
    iconColor: 'text-yellow-500',
  },
  high: {
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-200',
    iconColor: 'text-orange-500',
  },
  extreme: {
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-200',
    iconColor: 'text-red-500',
  },
}

export const RiskWarningBanner = memo(function RiskWarningBanner({
  level,
  title,
  message,
  actions = [],
  onAcknowledge,
  className = '',
}: RiskWarningBannerProps) {
  const config = riskLevelConfig[level]

  return (
    <div
      className={`
        ${config.bgColor} border ${config.borderColor} rounded-lg p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <ShieldExclamationIcon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${config.textColor}`}>{title}</h4>
          <p className={`mt-1 text-sm ${config.textColor} opacity-80`}>{message}</p>

          {actions.length > 0 && (
            <ul className="mt-3 space-y-1">
              {actions.map((action, index) => (
                <li
                  key={index}
                  className={`text-sm ${config.textColor} opacity-70 flex items-center gap-2`}
                >
                  <span className="w-1 h-1 bg-current rounded-full" />
                  {action}
                </li>
              ))}
            </ul>
          )}

          {onAcknowledge && (level === 'high' || level === 'extreme') && (
            <button
              onClick={onAcknowledge}
              className={`
                mt-4 px-4 py-2 text-sm font-medium rounded-lg
                ${config.bgColor} border ${config.borderColor}
                ${config.textColor} hover:bg-opacity-20 transition-colors
              `}
            >
              위험을 이해했습니다
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════
// Consent Checkbox
// ═══════════════════════════════════════════════════════════════

export const ConsentCheckbox = memo(function ConsentCheckbox({
  consentType,
  title,
  description,
  checked,
  onChange,
  required = false,
  className = '',
}: ConsentCheckboxProps) {
  return (
    <label
      className={`
        flex items-start gap-3 p-4 rounded-lg border border-white/10
        hover:border-white/20 transition-colors cursor-pointer
        ${checked ? 'bg-primary/10 border-primary/30' : 'bg-white/5'}
        ${className}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{title}</span>
          {required && (
            <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
              필수
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>
    </label>
  )
})

// ═══════════════════════════════════════════════════════════════
// Compact Disclaimer Footer
// ═══════════════════════════════════════════════════════════════

export const DisclaimerFooter = memo(function DisclaimerFooter({
  className = '',
}: {
  className?: string
}) {
  return (
    <footer
      className={`
        text-center text-xs text-gray-500 py-4 border-t border-white/5
        ${className}
      `}
    >
      <p>
        본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다.
        <br />
        투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.
      </p>
    </footer>
  )
})

// ═══════════════════════════════════════════════════════════════
// Export all components
// ═══════════════════════════════════════════════════════════════

export default {
  RiskDisclaimer,
  RiskWarningBanner,
  ConsentCheckbox,
  DisclaimerFooter,
}
