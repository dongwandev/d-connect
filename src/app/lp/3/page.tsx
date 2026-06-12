import Link from 'next/link'
import {
  AUDIENCES,
  CTA,
  DIFFERENTIATORS,
  FOOTER_TAGLINE,
  HERO,
  KEYWORDS,
  SDGS,
  STEPS,
} from '@/lib/landing-content'
import { VariantSwitcher } from '../VariantSwitcher'

/**
 * 랜딩 시안 3 — 에디토리얼 볼드 (#119 임시 라우트).
 * 잡지형: 초대형 타이포, 번호 섹션(01~04), 비대칭 그리드, SDG 컬러 스트립.
 */
export const metadata = { title: '랜딩 시안 3 | D-Connect' }

/** 비대칭 섹션 공통 래퍼 — 좌측 큰 번호 + 우측 콘텐츠 */
function EditorialSection({
  no,
  title,
  children,
}: {
  no: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-gray-900/10">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[220px_1fr] lg:gap-16">
        <div>
          <span className="block font-mono text-sm text-gray-400">{no}</span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
            {title}
          </h2>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}

export default function LandingVariant3() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf7] text-gray-900">
      {/* 상단 네비 — 미니멀 라인 */}
      <header className="sticky top-0 z-40 border-b border-gray-900/10 bg-[#fafaf7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-black tracking-tight">
            D—CONNECT
          </span>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/login" className="hover:text-brand-600">
              로그인
            </Link>
            <Link
              href="/signup"
              className="border-b-2 border-brand-600 pb-0.5 font-semibold hover:text-brand-600"
            >
              회원가입 ↗
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 — 초대형 타이포 + 마커 하이라이트 */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-24">
          <p className="animate-fade-up font-mono text-sm text-gray-500">
            {HERO.badge}
          </p>
          <h1
            className="animate-fade-up mt-6 max-w-4xl text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl"
            style={{ animationDelay: '0.1s' }}
          >
            {HERO.title1}
            <br />
            <span className="bg-[linear-gradient(transparent_62%,#bbf7d0_62%)]">
              {HERO.title2}
            </span>
          </h1>
          <div
            className="animate-fade-up mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
            style={{ animationDelay: '0.2s' }}
          >
            <p className="max-w-xl text-base leading-relaxed text-gray-600">
              {HERO.subtitle}
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="bg-gray-900 px-7 py-3.5 font-semibold text-white transition hover:bg-brand-600"
              >
                {CTA.primary}
              </Link>
              <Link
                href="/login"
                className="border border-gray-900 px-7 py-3.5 font-semibold transition hover:bg-gray-900 hover:text-white"
              >
                로그인
              </Link>
            </div>
          </div>
        </section>

        {/* 키워드 마키 — 블랙 밴드 */}
        <div className="overflow-hidden bg-gray-900 py-3">
          <div className="animate-marquee flex w-max items-center gap-10">
            {[0, 1].map((dup) => (
              <ul
                key={dup}
                aria-hidden={dup === 1}
                className="flex items-center gap-10 text-sm font-semibold tracking-wide text-white"
              >
                {KEYWORDS.map((k) => (
                  <li key={k} className="flex items-center gap-10">
                    <span>{k}</span>
                    <span aria-hidden className="text-brand-500">
                      ✦
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* 01 이용 흐름 — 에디토리얼 리스트 */}
        <EditorialSection no="01" title="이렇게 진행됩니다">
          <ol>
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="group grid gap-2 border-t border-gray-900/10 py-6 first:border-t-0 first:pt-0 sm:grid-cols-[64px_220px_1fr] sm:gap-6"
              >
                <span className="font-mono text-2xl font-bold text-gray-300 transition group-hover:text-brand-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </EditorialSection>

        {/* 02 차별점 */}
        <EditorialSection no="02" title="무엇이 다른가">
          <div className="grid gap-px overflow-hidden border border-gray-900/10 bg-gray-900/10 sm:grid-cols-3">
            {DIFFERENTIATORS.map((item) => (
              <div
                key={item.title}
                className="bg-[#fafaf7] p-6 transition hover:bg-white"
              >
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </EditorialSection>

        {/* 03 우선 지원 SDGs — 컬러 스트립 (hover 시 확장) */}
        <EditorialSection no="03" title="우선 지원 SDGs">
          <div className="flex h-44 gap-1 overflow-hidden">
            {SDGS.map((sdg) => (
              <div
                key={sdg.no}
                className="flex flex-1 cursor-default flex-col justify-between p-4 text-white transition-all duration-300 hover:flex-[2.2]"
                style={{ backgroundColor: sdg.color }}
              >
                <span className="text-3xl font-black opacity-90">
                  {sdg.no}
                </span>
                <span className="text-xs font-semibold leading-tight">
                  {sdg.name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-xs text-gray-400">
            SDG 8 · 11 · 12 · 17 — MVP 우선 지원 목표
          </p>
        </EditorialSection>

        {/* 04 타겟 사용자 */}
        <EditorialSection no="04" title="이런 분께">
          <div className="grid gap-10 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <div key={audience.title}>
                <h3 className="border-l-4 border-brand-600 pl-4 font-bold leading-snug">
                  {audience.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  {audience.description}
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-brand-700">
                  — {audience.example}
                </p>
              </div>
            ))}
          </div>
        </EditorialSection>

        {/* 하단 CTA — 블랙 블록 */}
        <section className="bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {CTA.title}
              </h2>
              <p className="mt-3 text-sm text-gray-400">{CTA.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="bg-brand-500 px-7 py-3.5 font-semibold text-gray-900 transition hover:bg-brand-100"
              >
                {CTA.primary}
              </Link>
              <Link
                href="/login"
                className="border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white hover:text-gray-900"
              >
                {CTA.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-900/10 bg-[#fafaf7]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-8 text-center text-sm text-gray-500 sm:flex-row sm:justify-between sm:text-left">
          <p>
            <span className="font-black tracking-tight text-gray-900">
              D—CONNECT
            </span>{' '}
            — {FOOTER_TAGLINE}
          </p>
          <nav className="flex gap-4">
            <Link href="/login" className="hover:text-gray-900">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-gray-900">
              회원가입
            </Link>
          </nav>
        </div>
      </footer>

      <VariantSwitcher current={3} />
    </div>
  )
}
