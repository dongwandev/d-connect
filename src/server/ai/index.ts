import 'server-only'
import { getOpenAI, hasApiKey } from './client'
import { mockGeneratedContent, mockSdgAnalysis } from './mock'
import type { CompanyInput } from './prompts'
import {
  CONTENT_GENERATION_SYSTEM_PROMPT,
  buildContentGenerationPrompt,
} from './prompts/content-generation'
import {
  SDG_ANALYSIS_SYSTEM_PROMPT,
  buildSdgAnalysisPrompt,
} from './prompts/sdg-analysis'
import type { GenerationOptionsStored } from '@/lib/enums'
import {
  GeneratedContentSchema,
  type ContentType,
  type GeneratedContent,
  type SdgAnalysisResult,
  type SdgGoal,
  SdgAnalysisResultSchema,
} from './schemas'
import { ANALYZE_SDG_TOOL, GENERATE_CONTENT_TOOL, type ToolDef } from './tools'
import { env } from '../env'

/**
 * AI 통합의 단일 진입점.
 *
 * 호출자는 응답이 mock인지 실 호출인지 구별할 필요 없이 항상 동일한 스키마를 받는다.
 * `usedFallback` 플래그는 운영 모니터링용(DB 저장)이며, API 응답에는 노출하지 않는다
 * (API.md §6 정책).
 *
 * fallback 조건:
 *   - OPENAI_API_KEY 비어 있음
 *   - OpenAI SDK 호출 실패 (네트워크/4xx/5xx)
 *   - 30초 타임아웃 초과
 *   - 응답이 zod 스키마 검증 실패
 *
 * 프로바이더: OpenAI chat completions + 함수 호출 강제 (#92 — ADR-0002 추록,
 * 비용 사유로 Anthropic에서 전환. 프롬프트·스키마는 프로바이더 중립 유지).
 */

// 시연 품질 우선 (#125) — 긴 고품질 생성이 완주하도록 타임아웃을 넉넉히,
// 출력 토큰을 크게 잡아 잘림→mock 폴백을 구조적으로 줄인다.
const AI_TIMEOUT_MS = 60_000
// 품질 우선 (#125, #127) — 잘림·부분출력·일시 오류를 충분히 흡수하도록 재시도 여유
const AI_MAX_ATTEMPTS = 3
const SDG_ANALYSIS_MAX_TOKENS = 4096
const CONTENT_MAX_TOKENS = 8000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

/**
 * mock 폴백 전 최대 N회 재시도 (#125).
 * 잘림·타임아웃·일시적 4xx/5xx는 재호출로 자주 복구되므로, 단 1회 실패로
 * 정적 mock(저품질)이 노출되는 것을 막는다.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt < attempts) {
        console.warn(`[ai] retry ${attempt}/${attempts} after error:`, e)
      }
    }
  }
  throw lastError
}

/**
 * 함수 호출 강제 1회 — 도구 인자(JSON)를 파싱해 반환. zod 검증은 호출자 몫.
 */
async function callTool(
  system: string,
  user: string,
  tool: ToolDef,
  maxTokens: number,
  temperature?: number,
): Promise<unknown> {
  const response = await getOpenAI().chat.completions.create({
    model: env.LLM_MODEL_DEFAULT,
    max_completion_tokens: maxTokens,
    ...(temperature !== undefined ? { temperature } : {}),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: tool.name } },
  })

  // 토큰 상한에 걸려 잘리면 JSON이 미완성→파싱/검증 실패의 숨은 원인이므로 가시화 (#125)
  if (response.choices[0]?.finish_reason === 'length') {
    console.warn(
      `[ai] output truncated (finish_reason=length, max_completion_tokens=${maxTokens}, tool=${tool.name}) — 토큰 상한을 더 올릴 것`,
    )
  }

  const call = response.choices[0]?.message.tool_calls?.[0]
  if (!call || call.type !== 'function') {
    throw new Error('AI_NO_TOOL_USE')
  }
  // tool_choice 강제로 항상 지정 도구가 와야 하지만 방어적으로 검증
  if (call.function.name !== tool.name) {
    throw new Error(`AI_UNEXPECTED_TOOL: ${call.function.name}`)
  }
  return JSON.parse(call.function.arguments) as unknown
}

export interface AnalyzeSdgOutput {
  result: SdgAnalysisResult
  usedFallback: boolean
}

export interface GenerateContentOutput {
  result: GeneratedContent
  usedFallback: boolean
}

// --- SDGs 분석 ---------------------------------------------------------------

export async function analyzeSdg(
  company: CompanyInput,
): Promise<AnalyzeSdgOutput> {
  if (!hasApiKey()) {
    console.warn('[ai] mock — no API key')
    return { result: mockSdgAnalysis(), usedFallback: true }
  }

  try {
    const result = await withRetry(
      () => withTimeout(callLlmForSdgAnalysis(company), AI_TIMEOUT_MS),
      AI_MAX_ATTEMPTS,
    )
    return { result, usedFallback: false }
  } catch (e) {
    console.error('[ai] mock — sdg analysis failed:', e)
    return { result: mockSdgAnalysis(), usedFallback: true }
  }
}

async function callLlmForSdgAnalysis(
  company: CompanyInput,
): Promise<SdgAnalysisResult> {
  const raw = await callTool(
    SDG_ANALYSIS_SYSTEM_PROMPT,
    buildSdgAnalysisPrompt(company),
    ANALYZE_SDG_TOOL,
    SDG_ANALYSIS_MAX_TOKENS,
    // 분류·점수의 일관성·재현성이 품질이므로 변동성을 낮춘다 (#125)
    0.3,
  )
  // SdgAnalysisResultSchema가 enum / 길이 / score 범위까지 함께 검증.
  // 실패 시 throw → 호출자(analyzeSdg)가 mock으로 폴백.
  return SdgAnalysisResultSchema.parse(raw)
}

// --- 콘텐츠 생성 -------------------------------------------------------------

export async function generateContent(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
  focusSdg: SdgGoal,
  options: GenerationOptionsStored,
): Promise<GenerateContentOutput> {
  if (!hasApiKey()) {
    console.warn('[ai] mock — no API key')
    return { result: mockGeneratedContent(contentType), usedFallback: true }
  }

  try {
    const result = await withRetry(
      () =>
        withTimeout(
          callLlmForContent(company, analysis, contentType, focusSdg, options),
          AI_TIMEOUT_MS,
        ),
      AI_MAX_ATTEMPTS,
    )
    return { result, usedFallback: false }
  } catch (e) {
    console.error('[ai] mock — content generation failed:', e)
    return { result: mockGeneratedContent(contentType), usedFallback: true }
  }
}

async function callLlmForContent(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
  focusSdg: SdgGoal,
  options: GenerationOptionsStored,
): Promise<GeneratedContent> {
  // 카드뉴스 장별 프롬프트 등 출력이 길어 잘리면 mock 폴백되므로 토큰을 넉넉히 (#98, #125)
  const raw = await callTool(
    CONTENT_GENERATION_SYSTEM_PROMPT,
    buildContentGenerationPrompt(company, analysis, contentType, focusSdg, options),
    GENERATE_CONTENT_TOOL,
    CONTENT_MAX_TOKENS,
  )
  // 모델이 type을 다른 값으로 반환할 수 있어 호출 측에서 강제 덮어쓰기.
  const parsed = GeneratedContentSchema.parse({
    ...(raw as Record<string, unknown>),
    type: contentType,
  })

  // 카드뉴스 완결성 검증 (#127) — 모델이 드물게 body를 [1장]만 쓰고 끝내는데
  // GeneratedContentSchema는 카드 수를 검증하지 않아 부분 출력이 통과한다.
  // 장 수가 모자라면 throw → withRetry가 재생성한다.
  if (contentType === 'CARD_NEWS' && options.slideCount) {
    const cardCount = (parsed.body.match(/\[\d+장\]/g) ?? []).length
    if (cardCount < options.slideCount) {
      throw new Error(
        `AI_INCOMPLETE_CARD_NEWS: body ${cardCount}/${options.slideCount}장`,
      )
    }
  }

  return parsed
}

// --- Public types (re-export) -----------------------------------------------

export { toCompanyInput } from './company-input'
export type { CompanyInput } from './prompts'
export type {
  ContentType,
  GeneratedContent,
  SdgAnalysisResult,
  SdgGoal,
} from './schemas'
