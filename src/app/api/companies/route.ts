import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { withErrorHandler } from '@/server/errors'
import { CreateCompanySchema } from './schemas'

/**
 * POST /api/companies — 기업 + 활동 atomic 생성.
 * 사양: docs/API.md §3.1
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = CreateCompanySchema.parse(await req.json())

    const company = await db.company.create({
      data: {
        name: body.name,
        industry: body.industry,
        region: body.region,
        product: body.product,
        purpose: body.purpose,
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
 * GET /api/companies — 기업 목록 (활동·분석 미포함).
 * 사양: docs/API.md §3.2
 */
export async function GET(): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const companies = await db.company.findMany({
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
