import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { generateContent, toCompanyInput } from '@/server/ai'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import type { GenerationOptionsStored, SocialCategory } from '@/lib/enums'
import { parseJsonArray, serializeJsonArray } from '@/lib/json-array'
import { CreateContentSchema, type CreateContentInput } from './schemas'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * 검증된 요청(유형별 union)을 저장·프롬프트용 wide 옵션으로 펼친다 (#123).
 * 각 유형이 가진 필드만 담는다 — POSTER엔 platform 없음, SNS_POST는
 * 이미지 미포함 시 비율/스타일 없음.
 */
function toStoredOptions(body: CreateContentInput): GenerationOptionsStored {
  const extra = body.extraRequest?.trim()
  const common = extra ? { extraRequest: extra } : {}
  switch (body.type) {
    case 'SNS_POST':
      return {
        ...common,
        platform: body.platform,
        bodyLength: body.bodyLength,
        tone: body.tone,
        withImage: body.withImage,
        ...(body.withImage
          ? { aspectRatio: body.aspectRatio, imageStyle: body.imageStyle }
          : {}),
      }
    case 'CARD_NEWS':
      return {
        ...common,
        aspectRatio: body.aspectRatio,
        imageStyle: body.imageStyle,
        slideCount: body.slideCount,
        density: body.density,
        closingCard: body.closingCard,
      }
    case 'SHORT_VIDEO_SCRIPT':
      return {
        ...common,
        platform: body.platform,
        aspectRatio: body.aspectRatio,
        imageStyle: body.imageStyle,
        videoDuration: body.videoDuration,
        sceneCount: body.sceneCount,
        subtitles: body.subtitles,
        mood: body.mood,
      }
    case 'POSTER':
      return {
        ...common,
        aspectRatio: body.aspectRatio,
        imageStyle: body.imageStyle,
        usage: body.usage,
        textAmount: body.textAmount,
      }
  }
}

/**
 * POST /api/sdg-analysis/[id]/content — 콘텐츠 생성 (AI).
 * 사양: docs/API.md §5.2, ADR-0005
 *
 * 흐름:
 *   1) 본인 소유 분석 + 기업·활동 조회
 *   2) generateContent (Anthropic, mock fallback)
 *   3) GeneratedContent 저장 + usedFallback 플래그
 *   4) JSON-string(hashtags)을 배열로 풀어서 반환
 */
export async function POST(
  req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params
    const body = CreateContentSchema.parse(await req.json())

    const analysis = await db.sdgAnalysis.findFirst({
      where: { id, company: { userId } },
      include: {
        company: { include: { activities: { orderBy: { createdAt: 'asc' } } } },
        matches: { orderBy: { score: 'desc' } },
      },
    })
    if (!analysis) {
      throw new ApiError('NOT_FOUND', `Analysis not found: ${id}`, 404)
    }

    // 홍보 대상 SDG는 이 분석에서 실제로 매칭된 목표여야 한다 (#92)
    if (!analysis.matches.some((m) => m.sdg === body.focusSdg)) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '이 분석에 매칭되지 않은 SDG입니다. 분석 결과의 SDG 중에서 선택해 주세요.',
        400,
      )
    }

    // 세부 설정 (#104, #123) — 유형별 옵션을 프롬프트 반영 + DB 저장용 wide shape로
    const options = toStoredOptions(body)

    const { result, usedFallback } = await generateContent(
      toCompanyInput(analysis.company),
      {
        matches: analysis.matches.map((m) => ({
          sdg: m.sdg,
          score: m.score,
          keywords: parseJsonArray<string>(m.keywords),
          rationale: m.rationale,
        })),
        socialFunctions: parseJsonArray<SocialCategory>(
          analysis.socialFunctions,
        ),
        publicMeaning: analysis.publicMeaning,
      },
      body.type,
      body.focusSdg,
      options,
    )

    const created = await db.generatedContent.create({
      data: {
        analysisId: analysis.id,
        type: result.type,
        focusSdg: body.focusSdg,
        options: JSON.stringify(options),
        body: result.body,
        hashtags: serializeJsonArray(result.hashtags),
        imagePrompt: result.imagePrompt ?? null,
        usedFallback,
      },
    })

    return {
      id: created.id,
      analysisId: created.analysisId,
      type: created.type,
      focusSdg: created.focusSdg,
      options: created.options,
      body: created.body,
      hashtags: parseJsonArray<string>(created.hashtags),
      imagePrompt: created.imagePrompt,
      editedByUser: created.editedByUser,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }
  })
}

/**
 * GET /api/sdg-analysis/[id]/contents — 분석에 속한 콘텐츠 목록 (본문 포함).
 * 사양: docs/API.md §5.1
 */
export async function GET(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const analysis = await db.sdgAnalysis.findFirst({
      where: { id, company: { userId } },
      select: { id: true },
    })
    if (!analysis) {
      throw new ApiError('NOT_FOUND', `Analysis not found: ${id}`, 404)
    }

    const contents = await db.generatedContent.findMany({
      where: { analysisId: id },
      orderBy: { createdAt: 'desc' },
    })

    return contents.map((c) => ({
      id: c.id,
      type: c.type,
      focusSdg: c.focusSdg,
      options: c.options,
      body: c.body,
      hashtags: parseJsonArray<string>(c.hashtags),
      imagePrompt: c.imagePrompt,
      editedByUser: c.editedByUser,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  })
}
