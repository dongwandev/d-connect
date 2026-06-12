import Link from 'next/link'
import {
  AUDIENCES,
  CTA,
  DIFFERENTIATORS,
  FOOTER_TAGLINE,
  HERO,
  SDGS,
  STEPS,
} from '@/lib/landing-content'
import { VariantSwitcher } from '../VariantSwitcher'

/**
 * 랜딩 시안 1 — 딥 그린 그라데이션 + 글로우 (#119 임시 라우트).
 * 모던 테크 톤: 다크 히어로, 글래스 카드, 그라데이션 타이포.
 */
export const metadata = { title: '랜딩 시안 1 | D-Connect' }

export default function LandingVariant1() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 상단 네비 — 다크 히어로 위에 얹히는 반투명 바 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-emerald-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-white">
            D-<span className="text-emerald-400">Connect</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-white/10"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
            >
              회원가입
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 — 딥 그라데이션 + 글로우 블롭 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-slate-900">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-emerald-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 right-1/5 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
            <p className="animate-fade-up inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-medium text-emerald-200">
              {HERO.badge}
            </p>
            <h1
              className="animate-fade-up mt-6 text-3xl font-bold leading-snug text-white sm:text-5xl sm:leading-tight"
              style={{ animationDelay: '0.1s' }}
            >
              {HERO.title1}
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
                {HERO.title2}
              </span>
            </h1>
            <p
              className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-emerald-100/80"
              style={{ animationDelay: '0.2s' }}
            >
              {HERO.subtitle}
            </p>
            <div
              className="animate-fade-up mt-10 flex items-center justify-center gap-3"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-400 px-7 py-3.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-300"
              >
                {CTA.primary}
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-white/20 bg-white/5 px-7 py-3.5 font-medium text-white backdrop-blur transition hover:bg-white/10"
              >
                로그인
              </Link>
            </div>

            {/* 우선 지원 SDGs — 히어로 하단 글래스 칩 */}
            <ul
              className="animate-fade-up mt-14 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: '0.4s' }}
            >
              {SDGS.map((sdg) => (
                <li
                  key={sdg.no}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 text-sm text-emerald-50 backdrop-blur"
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
        </section>

        {/* 이용 흐름 — 번호 + 연결선 */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            이렇게 진행됩니다
          </h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                {/* 데스크톱에서 카드 사이를 잇는 연결선 */}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-3 top-10 hidden h-px w-6 bg-gradient-to-r from-emerald-300 to-transparent lg:block"
                  />
                )}
                <div className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 font-bold text-white shadow-sm">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 차별점 — 다크 밴드 + 글래스 카드 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-green-950">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
              일반 AI 콘텐츠 도구와 무엇이 다른가요?
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {DIFFERENTIATORS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <h3 className="font-semibold text-emerald-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-50/75">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 타겟 사용자 */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            이런 분께 도움이 됩니다
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <div
                key={audience.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-emerald-300"
              >
                <h3 className="font-semibold text-gray-900">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {audience.description}
                </p>
                <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
                  {audience.example}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 하단 CTA — 다시 다크 그라데이션 */}
        <section className="relative overflow-hidden bg-gradient-to-r from-emerald-900 to-green-800">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              {CTA.title}
            </h2>
            <p className="mt-3 text-sm text-emerald-100/80">{CTA.subtitle}</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-7 py-3.5 font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                {CTA.primary}
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-white/25 px-7 py-3.5 font-medium text-white transition hover:bg-white/10"
              >
                {CTA.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-emerald-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-sm text-emerald-100/60 sm:flex-row sm:justify-between sm:text-left">
          <p>
            <span className="font-semibold text-emerald-100">D-Connect</span>{' '}
            — {FOOTER_TAGLINE}
          </p>
          <nav className="flex gap-4">
            <Link href="/login" className="hover:text-white">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-white">
              회원가입
            </Link>
          </nav>
        </div>
      </footer>

      <VariantSwitcher current={1} />
    </div>
  )
}
