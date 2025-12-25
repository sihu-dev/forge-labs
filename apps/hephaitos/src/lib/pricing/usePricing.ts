'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

// Database row types for type safety
interface PricingDisplayRow {
  package_id: string
  name: string
  name_ko: string
  credits: number
  bonus_credits: number
  price_krw: number
  price_usd: number
  is_popular: boolean
  is_highlighted: boolean
  display_order: number
  total_credits: number
  per_credit_krw: number
  per_credit_usd: number
}

interface FeaturePricingRow {
  feature_id: string
  feature_name: string
  feature_name_ko: string
  credit_cost: number
  category: 'copy' | 'learn' | 'build' | 'other'
  description?: string
  description_ko?: string
}

export interface CreditPackage {
  packageId: string
  name: string
  nameKo: string
  credits: number
  bonusCredits: number
  priceKrw: number
  priceUsd: number
  isPopular: boolean
  isHighlighted: boolean
  displayOrder: number
  totalCredits: number
  perCreditKrw: number
  perCreditUsd: number
}

export interface FeaturePricing {
  featureId: string
  featureName: string
  featureNameKo: string
  creditCost: number
  category: 'copy' | 'learn' | 'build' | 'other'
  description?: string
  descriptionKo?: string
}

// Mock data for development without Supabase
const MOCK_PACKAGES: CreditPackage[] = [
  {
    packageId: 'starter',
    name: 'Starter',
    nameKo: '스타터',
    credits: 100,
    bonusCredits: 0,
    priceKrw: 9900,
    priceUsd: 9,
    isPopular: false,
    isHighlighted: false,
    displayOrder: 1,
    totalCredits: 100,
    perCreditKrw: 99,
    perCreditUsd: 0.09,
  },
  {
    packageId: 'pro',
    name: 'Pro',
    nameKo: '프로',
    credits: 500,
    bonusCredits: 50,
    priceKrw: 39900,
    priceUsd: 39,
    isPopular: true,
    isHighlighted: true,
    displayOrder: 2,
    totalCredits: 550,
    perCreditKrw: 72.5,
    perCreditUsd: 0.07,
  },
  {
    packageId: 'enterprise',
    name: 'Enterprise',
    nameKo: '엔터프라이즈',
    credits: 2000,
    bonusCredits: 500,
    priceKrw: 149900,
    priceUsd: 149,
    isPopular: false,
    isHighlighted: false,
    displayOrder: 3,
    totalCredits: 2500,
    perCreditKrw: 60,
    perCreditUsd: 0.06,
  },
]

const MOCK_FEATURES: FeaturePricing[] = [
  {
    featureId: 'copy-trade',
    featureName: 'Copy Trading',
    featureNameKo: '카피 트레이딩',
    creditCost: 10,
    category: 'copy',
    description: 'Follow top traders automatically',
    descriptionKo: '셀럽 트레이더 자동 팔로우',
  },
  {
    featureId: 'ai-mentor',
    featureName: 'AI Mentor Session',
    featureNameKo: 'AI 멘토 세션',
    creditCost: 5,
    category: 'learn',
    description: 'Get personalized trading education',
    descriptionKo: '맞춤형 트레이딩 교육',
  },
  {
    featureId: 'strategy-builder',
    featureName: 'Strategy Builder',
    featureNameKo: '전략 빌더',
    creditCost: 20,
    category: 'build',
    description: 'Build custom trading strategies',
    descriptionKo: '커스텀 전략 구축',
  },
  {
    featureId: 'backtest',
    featureName: 'Backtest Run',
    featureNameKo: '백테스트 실행',
    creditCost: 3,
    category: 'build',
    description: 'Test strategies with historical data',
    descriptionKo: '과거 데이터로 전략 테스트',
  },
]

export function usePricing() {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [features, setFeatures] = useState<FeaturePricing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPricing = async () => {
      // Use mock data if Supabase is not configured
      if (!isSupabaseConfigured) {
        console.log('[Pricing] Using mock data (Supabase not configured)')
        setPackages(MOCK_PACKAGES)
        setFeatures(MOCK_FEATURES)
        setIsLoading(false)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          console.log('[Pricing] Using mock data (Supabase client unavailable)')
          setPackages(MOCK_PACKAGES)
          setFeatures(MOCK_FEATURES)
          setIsLoading(false)
          return
        }

        // Fetch credit packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('pricing_display')
          .select('*')
          .order('display_order')

        if (packagesError) {
          throw packagesError
        }

        // Fetch feature pricing
        const { data: featuresData, error: featuresError } = await supabase
          .from('feature_pricing')
          .select('*')
          .eq('is_active', true)
          .order('display_order')

        if (featuresError) {
          throw featuresError
        }

        // Map to camelCase with explicit typing
        const pkgList = (packagesData as PricingDisplayRow[] | null) || []
        setPackages(
          pkgList.map((pkg) => ({
            packageId: pkg.package_id,
            name: pkg.name,
            nameKo: pkg.name_ko,
            credits: pkg.credits,
            bonusCredits: pkg.bonus_credits,
            priceKrw: pkg.price_krw,
            priceUsd: pkg.price_usd,
            isPopular: pkg.is_popular,
            isHighlighted: pkg.is_highlighted,
            displayOrder: pkg.display_order,
            totalCredits: pkg.total_credits,
            perCreditKrw: pkg.per_credit_krw,
            perCreditUsd: pkg.per_credit_usd,
          }))
        )

        const featureList = (featuresData as FeaturePricingRow[] | null) || []
        setFeatures(
          featureList.map((feature) => ({
            featureId: feature.feature_id,
            featureName: feature.feature_name,
            featureNameKo: feature.feature_name_ko,
            creditCost: feature.credit_cost,
            category: feature.category,
            description: feature.description,
            descriptionKo: feature.description_ko,
          }))
        )

        setIsLoading(false)
      } catch (err) {
        console.error('[Pricing] Error fetching pricing:', err)
        // Fallback to mock data on error
        setPackages(MOCK_PACKAGES)
        setFeatures(MOCK_FEATURES)
        setError(err instanceof Error ? err.message : 'Failed to load pricing')
        setIsLoading(false)
      }
    }

    fetchPricing()
  }, [])

  return { packages, features, isLoading, error }
}
