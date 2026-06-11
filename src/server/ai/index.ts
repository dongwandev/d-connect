import 'server-only'
import { anthropic, hasApiKey } from './client'
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
import {
  GeneratedContentSchema,
  type ContentType,
  type GeneratedContent,
  type SdgAnalysisResult,
  type SdgGoal,
  SdgAnalysisResultSchema,
} from './schemas'
import { ANALYZE_SDG_TOOL, GENERATE_CONTENT_TOOL } from './tools'
import { env } from '../env'

/**
 * AI 통합의 단일 진입점.
 *
 * 호출자는 응답이 mock인지 실 호출인지 구별할 필요 없이 항상 동일한 스키마를 받는다.
 * `usedFallback` 플래그는 운영 모니터링용(DB 저장)이며, API 응답에는 노출하지 않는다
 * (API.md §6 정책).
 *
 * fallback 조건:
 *   - ANTHROPIC_API_KEY 비어 있음
 *   - Anthropic SDK 호출 실패 (네트워크/4xx/5xx)
 *   - 30초 타임아웃 초과
 *   - 응답이 zod 스키마 검증 실패
 *
 * 본 PR은 실 호출이 NOT_IMPLEMENTED라 항상 mock으로 폴백한다. 실제 Anthropic
 * 호출은 후속 PR에서 채운다.
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
      callAnthropicForSdgAnalysis(company),
      AI_TIMEOUT_MS,
    )
    return { result, usedFallback: false }
  } catch (e) {
    console.error('[ai] mock — sdg analysis failed:', e)
    return { result: mockSdgAnalysis(), usedFallback: true }
  }
}

async function callAnthropicForSdgAnalysis(
  company: CompanyInput,
): Promise<SdgAnalysisResult> {
  const response = await anthropic.messages.create({
    model: env.LLM_MODEL_DEFAULT,
    max_tokens: 1024,
    system: SDG_ANALYSIS_SYSTEM_PROMPT,
    tools: [ANALYZE_SDG_TOOL],
    tool_choice: { type: 'tool', name: ANALYZE_SDG_TOOL.name },
    messages: [{ role: 'user', content: buildSdgAnalysisPrompt(company) }],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI_NO_TOOL_USE')
  }

  // tool_choice 강제로 항상 analyze_sdg가 와야 하지만 방어적으로 검증
  if (toolUse.name !== ANALYZE_SDG_TOOL.name) {
    throw new Error(`AI_UNEXPECTED_TOOL: ${toolUse.name}`)
  }

  // SdgAnalysisResultSchema가 enum / 길이 / score 범위까지 함께 검증.
  // 실패 시 throw → 호출자(analyzeSdg)가 mock으로 폴백.
  return SdgAnalysisResultSchema.parse(toolUse.input)
}

// --- 콘텐츠 생성 -------------------------------------------------------------

export async function generateContent(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
  focusSdg: SdgGoal,
): Promise<GenerateContentOutput> {
  if (!hasApiKey()) {
    console.warn('[ai] mock — no API key')
    return { result: mockGeneratedContent(contentType), usedFallback: true }
  }

  try {
    const result = await withTimeout(
      callAnthropicForContent(company, analysis, contentType, focusSdg),
      AI_TIMEOUT_MS,
    )
    return { result, usedFallback: false }
  } catch (e) {
    console.error('[ai] mock — content generation failed:', e)
    return { result: mockGeneratedContent(contentType), usedFallback: true }
  }
}

async function callAnthropicForContent(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
  focusSdg: SdgGoal,
): Promise<GeneratedContent> {
  const response = await anthropic.messages.create({
    model: env.LLM_MODEL_DEFAULT,
    max_tokens: 1500,
    system: CONTENT_GENERATION_SYSTEM_PROMPT,
    tools: [GENERATE_CONTENT_TOOL],
    tool_choice: { type: 'tool', name: GENERATE_CONTENT_TOOL.name },
    messages: [
      {
        role: 'user',
        content: buildContentGenerationPrompt(
          company,
          analysis,
          contentType,
          focusSdg,
        ),
      },
    ],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI_NO_TOOL_USE')
  }
  if (toolUse.name !== GENERATE_CONTENT_TOOL.name) {
    throw new Error(`AI_UNEXPECTED_TOOL: ${toolUse.name}`)
  }

  // 모델이 type을 다른 값으로 반환할 수 있어 호출 측에서 강제 덮어쓰기.
  const raw = toolUse.input as Record<string, unknown>
  return GeneratedContentSchema.parse({
    ...raw,
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
