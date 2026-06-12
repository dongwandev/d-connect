import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

/**
 * SDGs 가이드 페이지 (D7 IA — 사이드바 'SDGs 가이드').
 *
 * SDGs가 무엇인지, D-Connect가 다루는 4가지 목표가 지역 기업 활동과
 * 어떻게 연결되는지 설명하는 정적 가이드.
 *
 * 컬러는 UN 공식 SDG 컬러 (SdgMatchCard와 동일 팔레트).
 */
export const dynamic = 'force-dynamic'

const GUIDE_SDGS = [
  {
    number: 8,
    color: '#A21942',
    name: '양질의 일자리와 경제성장',
    description:
      '모두를 위한 지속적·포용적·지속가능한 경제성장과 완전하고 생산적인 고용, 양질의 일자리를 촉진합니다.',
    examples: ['청년·취약계층 고용', '직업 교육·훈련', '공정한 노동 환경', '안정적 판로 제공'],
  },
  {
    number: 11,
    color: '#FD9D24',
    name: '지속가능한 도시와 공동체',
    description:
      '포용적이고 안전하며 회복력 있고 지속가능한 도시와 주거지를 조성합니다.',
    examples: ['지역 공동체 활동', '원도심 활성화', '로컬 문화 보존', '세대 연결 프로그램'],
  },
  {
    number: 12,
    color: '#BF8B2E',
    name: '책임 있는 소비와 생산',
    description: '지속가능한 소비와 생산 양식을 보장합니다.',
    examples: ['일회용품 감축', '로컬푸드·제철 식재료', '재활용·업사이클링', '친환경 포장'],
  },
  {
    number: 17,
    color: '#19486A',
    name: '목표 달성을 위한 파트너십',
    description:
      '이행 수단을 강화하고 지속가능발전을 위한 글로벌 파트너십을 활성화합니다.',
    examples: ['지역 기관 협력 (MOU)', '협동조합·공동 브랜드', '농가·공방 연대', '민관 협력 사업'],
  },
] as const

export default function SdgGuidePage() {
  return (
    <AppShell
      title="SDGs 가이드"
      description="지속가능발전목표와 D-Connect가 다루는 4가지 목표"
    >
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* 인트로 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-gray-900">
            SDGs(지속가능발전목표)란?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            SDGs(Sustainable Development Goals)는 2015년 UN 총회에서 채택된
            <strong> 2030년까지의 글로벌 공동 목표 17가지</strong>입니다.
            빈곤·불평등·기후변화·평화 등 인류가 함께 풀어야 할 과제를 담고
            있으며, 정부·기업·시민사회가 각자의 자리에서 실천하도록
            설계되었습니다.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            최근 지자체·공공기관의 사업 공모와 지역상생 캠페인에서{' '}
            <strong>“이 활동이 어떤 SDG와 연결되는가”</strong>를 묻는 경우가
            늘고 있습니다. 작은 기업도 자신의 활동을 SDGs 언어로 설명할 수
            있다면 공공 협력의 문이 넓어집니다.
          </p>
        </section>

        {/* 왜 4가지인가 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-gray-900">
            D-Connect는 왜 4가지 목표에 집중하나요?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            17가지 목표 중 대전·세종·충남권 소상공인·사회적경제기업의 활동과
            가장 자주, 가장 자연스럽게 연결되는{' '}
            <strong>SDG 8 · 11 · 12 · 17</strong> 네 가지를 우선
            지원합니다. 범위를 좁힌 만큼 매칭 근거와 추천 점수의 정확도를
            높일 수 있습니다.
          </p>
        </section>

        {/* SDG 4종 카드 */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {GUIDE_SDGS.map((sdg) => (
            <article
              key={sdg.number}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div
                className="flex items-center gap-3 px-5 py-4 text-white"
                style={{ backgroundColor: sdg.color }}
              >
                <span className="text-2xl font-extrabold" aria-hidden>
                  {sdg.number}
                </span>
                <h3 className="text-sm font-bold leading-snug">
                  SDG {sdg.number} · {sdg.name}
                </h3>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-sm leading-relaxed text-gray-700">
                  {sdg.description}
                </p>
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    지역 기업 활동 예시
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {sdg.examples.map((ex) => (
                      <li
                        key={ex}
                        className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-gray-700"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* D-Connect에서 활용 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-bold text-gray-900">
            D-Connect에서는 이렇게 활용해요
          </h2>
          <ol className="mt-3 space-y-3">
            {[
              {
                step: '1',
                title: '기업·활동 입력',
                desc: '기업 정보와 지역사회 기여 활동을 입력합니다.',
              },
              {
                step: '2',
                title: 'AI SDGs 분석',
                desc: 'AI가 활동을 분석해 관련 SDG를 점수·키워드·근거 문장과 함께 추천합니다.',
              },
              {
                step: '3',
                title: '공공홍보 콘텐츠 생성',
                desc: '매칭된 SDG를 토대로 SNS·카드뉴스·숏폼·슬로건 초안을 생성하고 직접 다듬습니다.',
              },
            ].map((s) => (
              <li key={s.step} className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-sm font-bold text-accent-600"
                  aria-hidden
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {s.title}
                  </p>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 border-t border-border pt-4">
            <Link
              href="/companies/new"
              className="inline-flex rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              지금 시작하기 — 새 기업 등록
            </Link>
          </div>
        </section>

        <p className="text-xs text-gray-500">
          참고: UN 지속가능발전목표 공식 정보는{' '}
          <a
            href="https://sdgs.un.org/goals"
            target="_blank"
            rel="noreferrer"
            className="text-accent-600 underline"
          >
            sdgs.un.org/goals
          </a>
          에서 확인할 수 있습니다.
        </p>
      </div>
    </AppShell>
  )
}
