import 'server-only'
import { z } from 'zod'

/**
 * 서버 전용 환경 변수.
 * - 누락/오타 시 모듈 로드 시점에 즉시 실패한다.
 * - 선택값(`ANTHROPIC_API_KEY`)이 비어 있으면 mock fallback 경로로 동작한다 (PRD §5.2).
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL_DEFAULT: z.string().min(1).default('claude-sonnet-4-7-latest'),
  LLM_MODEL_FAST: z.string().min(1).default('claude-haiku-4-7-latest'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // --- 인증 (ADR-0004). 모두 optional — 미설정 provider는 자동 비활성화. ---
  // production에서는 NEXTAUTH_SECRET 필수 (NextAuth가 런타임에 검증).
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
})

export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>
