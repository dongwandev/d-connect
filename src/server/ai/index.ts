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

const AI_TIMEOUT_MS = 30_000

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
 * 함수 호출 강제 1회 — 도구 인자(JSON)를 파싱해 반환. zod 검증은 호출자 몫.
 */
async function callTool(
  system: string,
  user: string,
  tool: ToolDef,
  maxTokens: number,
): Promise<unknown> {
  const response = await getOpenAI().chat.completions.create({
    model: env.LLM_MODEL_DEFAULT,
    max_completion_tokens: maxTokens,
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
    const result = await withTimeout(
      callLlmForSdgAnalysis(company),
      AI_TIMEOUT_MS,
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
    1024,
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
    const result = await withTimeout(
      callLlmForContent(company, analysis, contentType, focusSdg, options),
      AI_TIMEOUT_MS,
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
  // 카드뉴스 장별 프롬프트 등 출력이 길어 1500이면 잘려 mock 폴백될 수 있다 (#98)
  const raw = await callTool(
    CONTENT_GENERATION_SYSTEM_PROMPT,
    buildContentGenerationPrompt(company, analysis, contentType, focusSdg, options),
    GENERATE_CONTENT_TOOL,
    3000,
  )
  // 모델이 type을 다른 값으로 반환할 수 있어 호출 측에서 강제 덮어쓰기.
  return GeneratedContentSchema.parse({
    ...(raw as Record<string, unknown>),
    type: contentType,
  })
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
