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
 * 랜딩 시안 2 — 밝고 둥근 캠페인 톤 (#119 임시 라우트).
 * 크림 배경 + 도트 패턴, SDG 컬러 모자이크, 키워드 마키, 라운드 카드.
 */
export const metadata = { title: '랜딩 시안 2 | D-Connect' }

/** 차별점 카드용 이모지 — 캠페인 톤의 친근함 (장식용, aria-hidden) */
const DIFF_EMOJI = ['🏛️', '🎯', '✍️'] as const

export default function LandingVariant2() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf4]">
      {/* 상단 네비 */}
      <header className="sticky top-0 z-40 border-b border-green-100 bg-[#f8faf4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-gray-900">
            D-<span className="text-brand-600">Connect</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-green-100/60"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              회원가입
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 — 좌 텍스트 + 우 SDG 모자이크, 도트 패턴 배경 */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#bbe5c4_1px,transparent_1px)] bg-[size:22px_22px] opacity-40"
          />
          <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.2fr_1fr]">
            <div className="animate-fade-up text-center lg:text-left">
              <p className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
                🌱 {HERO.badge}
              </p>
              <h1 className="mt-6 text-3xl font-extrabold leading-snug text-gray-900 sm:text-4xl">
                {HERO.title1}
                <br />
                <span className="text-brand-600">{HERO.title2}</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-gray-600">
                {HERO.subtitle}
              </p>
              <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/signup"
                  className="rounded-full bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-md shadow-green-200 transition hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  {CTA.primary}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border-2 border-brand-600/30 bg-white px-7 py-3 font-medium text-brand-700 transition hover:border-brand-600/60"
                >
                  로그인
                </Link>
              </div>
            </div>

            {/* SDG 컬러 모자이크 — 순수 CSS 그래픽 */}
            <div
              className="animate-fade-up mx-auto w-full max-w-xs"
              style={{ animationDelay: '0.15s' }}
              aria-hidden
            >
              <div className="grid rotate-2 grid-cols-2 gap-3 transition hover:rotate-0">
                {SDGS.map((sdg, i) => (
                  <div
                    key={sdg.no}
                    className={`flex aspect-square flex-col justify-between rounded-2xl p-4 text-white shadow-lg ${i % 2 === 1 ? 'translate-y-4' : ''}`}
                    style={{ backgroundColor: sdg.color }}
                  >
                    <span className="text-3xl font-extrabold opacity-90">
                      {sdg.no}
                    </span>
                    <span className="text-xs font-semibold leading-tight">
                      {sdg.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 활동 키워드 — 정적 칩 띠 (마키는 시선을 빼앗아 정적으로 교체) */}
        <div className="border-y border-green-100 bg-brand-600 py-6">
          <p className="text-center text-xs font-semibold tracking-wide text-brand-100">
            이런 활동이 SDGs와 연결됩니다
          </p>
          <ul className="mx-auto mt-3 flex max-w-4xl flex-wrap items-center justify-center gap-2 px-6">
            {KEYWORDS.map((k) => (
              <li
                key={k}
                className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white"
              >
                {k}
              </li>
            ))}
          </ul>
        </div>

        {/* 이용 흐름 — 점선 연결 + 컬러 뱃지 */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
            이렇게 진행됩니다 👀
          </h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-5 top-7 hidden w-4 border-t-2 border-dashed border-brand-500/50 lg:block"
                  />
                )}
                <div className="h-full rounded-3xl border-2 border-green-100 bg-white p-6 transition hover:-translate-y-1.5 hover:border-brand-500/50 hover:shadow-lg hover:shadow-green-100">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-lg font-extrabold text-brand-700">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 차별점 — 이모지 라운드 카드 */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
              일반 AI 콘텐츠 도구와 무엇이 다른가요?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {DIFFERENTIATORS.map((item, i) => (
                <div
                  key={item.title}
                  className="rounded-3xl bg-[#f8faf4] p-7 transition hover:rotate-1 hover:shadow-md"
                >
                  <span aria-hidden className="text-3xl">
                    {DIFF_EMOJI[i]}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 타겟 사용자 — 말풍선 예시 */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
            이런 분께 도움이 됩니다
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <div
                key={audience.title}
                className="rounded-3xl border-2 border-green-100 bg-white p-7 transition hover:border-brand-500/40"
              >
                <h3 className="text-lg font-bold text-gray-900">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {audience.description}
                </p>
                <p className="mt-4 rounded-2xl rounded-tl-sm bg-brand-100/60 px-4 py-3 text-sm font-medium leading-relaxed text-brand-700">
                  💬 {audience.example}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 하단 CTA — 큰 라운드 박스 */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-green-700 px-6 py-16 text-center shadow-xl shadow-green-200">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#ffffff22_1px,transparent_1px)] bg-[size:18px_18px]"
            />
            <div className="relative">
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                {CTA.title}
              </h2>
              <p className="mt-3 text-sm text-brand-100">{CTA.subtitle}</p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-white px-7 py-3.5 font-bold text-brand-700 transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  {CTA.primary}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border-2 border-white/40 px-7 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  {CTA.secondary}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-sm text-gray-500 sm:flex-row sm:justify-between sm:text-left">
          <p>
            <span className="font-bold text-gray-700">D-Connect</span> —{' '}
            {FOOTER_TAGLINE}
          </p>
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

      <VariantSwitcher current={2} />
    </div>
  )
}
