/**
 * User Profile Page
 * /dashboard/profile
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/profile/ProfileEditor'
import { CreditDashboard } from '@/components/profile/CreditDashboard'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch credit balance
  const { data: credits } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0D0D0F] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">프로필 설정</h1>
          <p className="text-sm text-zinc-400">
            계정 정보를 관리하고 크레딧을 확인하세요
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-2">
            <ProfileEditor user={user} profile={profile} />
          </div>

          {/* Right Column: Credit Dashboard */}
          <div className="lg:col-span-1">
            <CreditDashboard
              userId={user.id}
              initialBalance={credits?.balance || 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
