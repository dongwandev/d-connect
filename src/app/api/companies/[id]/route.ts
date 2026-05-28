import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { serializeJsonArray } from '@/lib/json-array'
import { CreateCompanySchema } from '../schemas'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/companies/[id] — 본인 기업 상세 (활동 + 최신 분석 1개).
 * 사양: docs/API.md §3.3, ADR-0005
 */
export async function GET(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const company = await db.company.findFirst({
      where: { id, userId },
      include: {
        activities: { orderBy: { createdAt: 'asc' } },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, createdAt: true },
        },
      },
    })

    if (!company) {
      throw new ApiError('NOT_FOUND', `Company not found: ${id}`, 404)
    }

    const { analyses, ...rest } = company
    return {
      ...rest,
      latestAnalysis: analyses[0] ?? null,
    }
  })
}

/**
 * PATCH /api/companies/[id] — 본인 기업 정보 수정 (D6 사용자 요청).
 *
 * 전체 replace 패턴 — 폼이 모든 필드를 다시 보내고 activities는 deleteMany +
 * create로 교체한다. 부분 업데이트가 필요하면 별도 endpoint 추가.
 */
export async function PATCH(
  req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params
    const body = CreateCompanySchema.parse(await req.json())

    // 본인 소유 검증
    const existing = await db.company.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    if (!existing) {
      throw new ApiError('NOT_FOUND', `Company not found: ${id}`, 404)
    }

    const updated = await db.company.update({
      where: { id },
      data: {
        name: body.name,
        foundedYear: body.foundedYear ?? null,
        businessType: body.businessType ?? null,
        sido: body.sido ?? null,
        sigungu: body.sigungu ?? null,
        industryCategory: body.industryCategory ?? null,
        product: body.product ?? null,
        targetAudiences: body.targetAudiences?.length
          ? serializeJsonArray(body.targetAudiences)
          : null,
        promoGoals: body.promoGoals?.length
          ? serializeJsonArray(body.promoGoals)
          : null,
        // 활동은 replace (단순화). 분석/콘텐츠는 활동 변경에 영향받지 않음.
        activities: {
          deleteMany: {},
          create: body.activities.map((a) => ({
            category: a.category,
            title: a.title,
            description: a.description,
          })),
        },
      },
      include: { activities: { orderBy: { createdAt: 'asc' } } },
    })

    return updated
  })
}
