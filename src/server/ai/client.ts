import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../env'

/**
 * Anthropic Claude SDK 인스턴스.
 *
 * API 키가 없으면 인스턴스는 그대로 만들지만, 실제 호출은 mock fallback을
 * 거치므로 흐름이 깨지지 않는다 (PRD §5.2, ARCHITECTURE §5 참고).
 */
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY ?? '',
})

export const hasApiKey = (): boolean => Boolean(env.ANTHROPIC_API_KEY)
