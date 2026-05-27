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
})

export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>
