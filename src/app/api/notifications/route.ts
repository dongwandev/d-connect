import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { withErrorHandler } from '@/server/errors'
import { CONTENT_TYPE_LABEL, type ContentType } from '@/lib/enums'

/**
 * GET /api/notifications — 본인 활동 이벤트 알림 (D7 사용자 요청).
 *
 * 별도 Notification 테이블 없이 기존 데이터의 createdAt에서 파생한다
 * (DB schema 변경 = 위험 작업 회피, 프로토타입 단계):
 *   - SDGs 분석 완료  (SdgAnalysis)
 *   - 콘텐츠 생성 완료 (GeneratedContent)
 *   - 기업 등록 완료  (Company)
 *   - mock fallback 발생 건은 warning 톤으로 구분 (usedFallback=true)
 *
 * 읽음 상태는 클라이언트(localStorage lastSeenAt)가 관리한다.
 * 권한 (ADR-0005): 모든 소스를 company.userId 경유로 본인 것만 조회.
 */
export const dynamic = 'force-dynamic'

export interface NotificationItem {
  id: string
  kind: 'ANALYSIS_DONE' | 'CONTENT_DONE' | 'COMPANY_CREATED'
  tone: 'success' | 'warning' | 'info'
  title: string
  body: string
  link: string
  createdAt: string // ISO
}

const LIMIT_PER_SOURCE = 10
const LIMIT_TOTAL = 15

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()

    const [analyses, contents, companies] = await Promise.all([
      db.sdgAnalysis.findMany({
        where: { company: { userId } },
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_SOURCE,
        select: {
          id: true,
          usedFallback: true,
          createdAt: true,
          company: { select: { name: true } },
        },
      }),
      db.generatedContent.findMany({
        where: { analysis: { company: { userId } } },
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_SOURCE,
        select: {
          id: true,
          type: true,
          usedFallback: true,
          createdAt: true,
          analysis: {
            select: { company: { select: { name: true } } },
          },
        },
      }),
      db.company.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_SOURCE,
        select: { id: true, name: true, createdAt: true },
      }),
    ])

    const items: NotificationItem[] = [
      ...analyses.map(
        (a): NotificationItem => ({
          id: `analysis:${a.id}`,
          kind: 'ANALYSIS_DONE',
          tone: a.usedFallback ? 'warning' : 'success',
          title: a.usedFallback
            ? 'SDGs 분석 완료 (mock 응답)'
            : 'SDGs 분석 완료',
          body: a.usedFallback
            ? `${a.company.name} — API 키 미설정으로 mock 결과가 저장되었습니다.`
            : `${a.company.name}의 활동 분석이 끝났어요. 추천 SDGs를 확인해 보세요.`,
          link: `/sdg-analysis/${a.id}`,
          createdAt: a.createdAt.toISOString(),
        }),
      ),
      ...contents.map(
        (c): NotificationItem => ({
          id: `content:${c.id}`,
          kind: 'CONTENT_DONE',
          tone: c.usedFallback ? 'warning' : 'success',
          title: `${CONTENT_TYPE_LABEL[c.type as ContentType]} 생성 완료${
            c.usedFallback ? ' (mock 응답)' : ''
          }`,
          body: `${c.analysis.company.name}의 콘텐츠 초안이 준비됐어요.`,
          link: `/contents/${c.id}`,
          createdAt: c.createdAt.toISOString(),
        }),
      ),
      ...companies.map(
        (c): NotificationItem => ({
          id: `company:${c.id}`,
          kind: 'COMPANY_CREATED',
          tone: 'info',
          title: '기업 등록 완료',
          body: `${c.name}이(가) 등록되었어요. SDGs 분석을 실행해 보세요.`,
          link: `/companies/${c.id}`,
          createdAt: c.createdAt.toISOString(),
        }),
      ),
    ]
      .sort(
        (x, y) =>
          new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      )
      .slice(0, LIMIT_TOTAL)

    return items
  })
}
