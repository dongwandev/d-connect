import Link from 'next/link'

/**
 * 인증 화면(로그인·회원가입·계정 찾기·비밀번호 재설정) 공용 레이아웃 (#119).
 *
 * 상단 바의 로고 클릭 → 랜딩(/)으로 — 비로그인 방문자가 인증 화면에서
 * 서비스 소개로 되돌아갈 수 있는 유일한 동선이다.
 * 카드 영역은 기존 인증 페이지들의 중앙 정렬 레이아웃을 그대로 유지한다.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf4]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-3.5">
          <Link
            href="/"
            aria-label="D-Connect 소개 페이지로 이동"
            className="text-lg font-bold text-gray-900"
          >
            D-<span className="text-brand-600">Connect</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  )
}
