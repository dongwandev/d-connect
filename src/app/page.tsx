import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

/**
 * 진입점 — 서비스 소개 랜딩 (#115).
 * - 로그인 → /dashboard (기존 동작 유지)
 * - 비로그인 → 서비스 소개 후 로그인/회원가입 유도
 *
 * 톤 가드: 광고성·과장 표현 없이 PRD §1의 정의·차별점을 그대로 풀어쓴다.
 */
export const dynamic = 'force-dynamic'

/** 이용 흐름 4단계 — PRD §3 핵심 기능 순서 그대로 */
const STEPS = [
  {
    title: '기업·활동 정보 입력',
    description:
      '기업 기본 정보와 지역사회 기여 활동(고용·환경·지역경제·공동체·협력)을 입력합니다.',
  },
  {
    title: 'SDGs 자동 분석',
    description:
      'AI가 활동 내용과 관련성이 높은 SDGs 목표를 추천하고, 매칭 키워드와 연결 근거를 함께 제시합니다.',
  },
  {
    title: '공공홍보 콘텐츠 생성',
    description:
      'SNS 게시글·카드뉴스 문안·숏폼 대본·캠페인 슬로건 중 원하는 유형의 초안을 생성합니다.',
  },
  {
    title: '저장·수정·관리',
    description:
      '분석 결과와 콘텐츠를 대시보드에서 한눈에 보고, 초안을 직접 다듬어 실제 홍보에 활용합니다.',
  },
] as const

/** 차별점 3가지 — PRD §1.3 */
const DIFFERENTIATORS = [
  {
    title: '공공성 우선',
    description:
      '광고성 문구가 아니라 공공기관·지자체가 그대로 검토하고 활용할 수 있는 톤과 근거 중심으로 작성합니다.',
  },
  {
    title: 'SDGs 매핑 내장',
    description:
      '활동이 어떤 SDGs 목표와 연결되는지 직접 판단할 필요 없이, 추천 목표와 매칭 근거를 자동으로 제시합니다.',
  },
  {
    title: '검토 가능한 초안',
    description:
      '생성 결과는 항상 사람이 수정할 수 있는 초안으로 제공됩니다. 최종 표현은 담당자가 결정합니다.',
  },
] as const

/** MVP 우선 지원 SDGs — 번호·이름·공식 컬러 (PRD §3.2) */
const SDGS = [
  { no: 8, name: '양질의 일자리와 경제 성장', color: '#A21942' },
  { no: 11, name: '지속가능한 도시와 공동체', color: '#FD9D24' },
  { no: 12, name: '지속가능한 소비와 생산', color: '#BF8B2E' },
  { no: 17, name: '목표 달성을 위한 파트너십', color: '#19486A' },
] as const

/** 타겟 사용자 2그룹 — PRD §2 페르소나 */
const AUDIENCES = [
  {
    title: '소상공인·사회적경제기업 홍보 담당자',
    description:
      '지역 고용, 친환경 활동, 로컬푸드, 지역 행사 참여 같은 기여 활동을 하고 있지만, SDGs나 공공홍보 문구 작성이 익숙하지 않은 분.',
    example: '지자체 사업·공공기관 협업 자료에 넣을 신뢰성 있는 소개 문구가 필요할 때',
  },
  {
    title: '지자체·공공기관 캠페인 담당자',
    description:
      '지역 기업 사례를 발굴해 카드뉴스, 보도자료, SNS 콘텐츠로 소개해야 하는 분.',
    example: '여러 기업의 활동을 같은 기준으로 비교·정리하고 초안을 빠르게 확보하고 싶을 때',
  },
] as const

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      {/* 상단 네비 */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-gray-900">
            D-<span className="text-brand-600">Connect</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
            >
              회원가입
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <p className="inline-block rounded-full bg-brand-50 px-4 py-1 text-sm font-medium text-brand-700">
              대전·세종·충남 소상공인·사회적경제기업을 위한
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-snug text-gray-900 sm:text-4xl">
              우리 기업의 지역사회 기여 활동,
              <br />
              <span className="text-brand-600">SDGs와 연결된 공공홍보 콘텐츠</span>로
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
              활동 정보를 입력하면 관련 SDGs 목표 추천과 연결 근거, 그리고
              공공기관·지자체가 검토할 수 있는 톤의 홍보 콘텐츠 초안까지 한
              번에 제공하는 AI 기반 도구입니다.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded bg-accent-500 px-6 py-3 font-medium text-white hover:bg-accent-600"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/login"
                className="rounded border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                로그인
              </Link>
            </div>
          </div>
        </section>

        {/* 이용 흐름 */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            이렇게 진행됩니다
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-lg border border-border bg-white p-6 shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* 차별점 */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              일반 AI 콘텐츠 도구와 무엇이 다른가요?
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {DIFFERENTIATORS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border bg-surface-muted p-6"
                >
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* 우선 지원 SDGs */}
            <div className="mt-12 rounded-lg border border-border bg-surface-muted px-6 py-5">
              <p className="text-center text-sm font-medium text-gray-700">
                우선 지원하는 SDGs 목표
              </p>
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {SDGS.map((sdg) => (
                  <li
                    key={sdg.no}
                    className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm text-gray-700 shadow-sm"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: sdg.color }}
                    >
                      {sdg.no}
                    </span>
                    {sdg.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 타겟 사용자 */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            이런 분께 도움이 됩니다
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <div
                key={audience.title}
                className="rounded-lg border border-border bg-white p-6 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {audience.description}
                </p>
                <p className="mt-3 rounded bg-brand-50 px-3 py-2 text-sm leading-relaxed text-brand-700">
                  {audience.example}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 하단 CTA */}
        <section className="bg-brand-600">
          <div className="mx-auto max-w-5xl px-6 py-14 text-center">
            <h2 className="text-2xl font-bold text-white">
              지금 우리 기업의 활동을 입력해 보세요
            </h2>
            <p className="mt-2 text-sm text-brand-100">
              회원가입 후 기업 정보 입력부터 콘텐츠 생성까지 바로 사용할 수
              있습니다.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded bg-white px-6 py-3 font-medium text-brand-700 hover:bg-brand-50"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/login"
                className="rounded border border-brand-100/50 px-6 py-3 font-medium text-white hover:bg-brand-700"
              >
                이미 계정이 있어요
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-sm text-gray-500 sm:flex-row sm:justify-between sm:text-left">
          <p>
            <span className="font-semibold text-gray-700">D-Connect</span> —
            지역 기업의 사회적 가치를 잇는 AI 공공홍보 도구
          </p>
          {/* 공지사항·SDGs 가이드는 AppShell 게이트(로그인 필수) 안에 있어 링크하지 않는다 */}
          <nav className="flex gap-4">
            <Link href="/login" className="hover:text-gray-700">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-gray-700">
              회원가입
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
