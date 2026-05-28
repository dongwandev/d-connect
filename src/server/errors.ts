import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * 표준 에러 코드 — 클라이언트에 그대로 노출된다.
 * 새 코드를 추가하면 [docs/ARCHITECTURE.md §6 에러 처리](../../docs/ARCHITECTURE.md) 표에도 반영한다.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'AI_FAILED_FALLBACK_USED'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number = 400,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Route Handler를 감싸는 wrapper.
 *
 * @example
 *   export async function POST(req: NextRequest) {
 *     return withErrorHandler(async () => {
 *       const body = SomeSchema.parse(await req.json())
 *       const result = await doWork(body)
 *       return result
 *     })
 *   }
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await fn()
    return NextResponse.json({ data })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status },
      )
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR' satisfies ApiErrorCode,
            message: 'Invalid request',
            details: e.issues,
          },
        },
        { status: 400 },
      )
    }
    console.error('[unhandled]', e)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR' satisfies ApiErrorCode,
          message: 'Internal server error',
        },
      },
      { status: 500 },
    )
  }
}
