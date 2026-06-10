import { redirect } from 'next/navigation'

/**
 * 구 계정 정보 경로 — D7 IA 개편으로 /mypage(마이페이지)에 통합.
 * 북마크·구 링크 호환을 위해 redirect만 유지한다.
 */
export const dynamic = 'force-dynamic'

export default function AccountRedirect() {
  redirect('/mypage')
}
