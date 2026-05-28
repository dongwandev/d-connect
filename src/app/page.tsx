import { redirect } from 'next/navigation'
import { auth } from '@/auth'

/**
 * 진입점.
 * - 로그인 → /dashboard
 * - 비로그인 → /login
 *
 * (디자인 폴리시 단계에서 마케팅형 랜딩으로 교체 검토)
 */
export const dynamic = 'force-dynamic'

export default async function RootRedirect() {
  const session = await auth()
  redirect(session?.user ? '/dashboard' : '/login')
}
