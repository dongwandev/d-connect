import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { withErrorHandler } from '@/server/errors'
import { CreateCompanySchema } from './schemas'

/**
 * POST /api/companies — 기업 + 활동 atomic 생성 (본인 소유).
 * 사양: docs/API.md §3.1, ADR-0005
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const body = CreateCompanySchema.parse(await req.json())

    const company = await db.company.create({
      data: {
        userId,
        name: body.name,
        foundedYear: body.foundedYear,
        businessType: body.businessType,
        sido: body.sido,
        sigungu: body.sigungu,
        industryCategory: body.industryCategory,
        product: body.product,
        targetAudience: body.targetAudience,
        promoGoal: body.promoGoal,
        activities: {
          create: body.activities.map((a) => ({
            category: a.category,
            title: a.title,
            description: a.description,
          })),
        },
      },
      include: { activities: true },
    })

    return company
  })
}

/**
 * GET /api/companies — 본인 기업 목록 (활동·분석 미포함).
 * 사양: docs/API.md §3.2, ADR-0005
 */
export async function GET(): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const companies = await db.company.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        industry: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return companies
  })
}
