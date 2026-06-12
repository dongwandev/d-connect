import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { withErrorHandler } from '@/server/errors'
import { CreateInquirySchema } from './schemas'

/**
 * POST /api/inquiries — 1:1 문의 접수 (본인 계정).
 * 사양: docs/API.md §8.1
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const body = CreateInquirySchema.parse(await req.json())

    const inquiry = await db.inquiry.create({
      data: {
        userId,
        type: body.type,
        title: body.title,
        body: body.body,
      },
    })

    return inquiry
  })
}

/**
 * GET /api/inquiries — 내 문의 목록 (최신순).
 * 사양: docs/API.md §8.2, ADR-0005 (본인 것만)
 */
export async function GET(): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const inquiries = await db.inquiry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return inquiries
  })
}
