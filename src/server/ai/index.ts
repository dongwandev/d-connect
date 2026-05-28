import 'server-only'
import { hasApiKey } from './client'
import { mockGeneratedContent, mockSdgAnalysis } from './mock'
import type { CompanyInput } from './prompts'
import {
  type ContentType,
  type GeneratedContent,
  type SdgAnalysisResult,
} from './schemas'

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
  _company: CompanyInput,
): Promise<SdgAnalysisResult> {
  // TODO(PR 4): 후속 PR에서 채움
  //   1) buildSdgAnalysisPrompt(company)로 프롬프트 구성
  //   2) anthropic.messages.create({ model: env.LLM_MODEL_DEFAULT, ... })
  //   3) SdgAnalysisResultSchema.parse(response)로 검증
  //   4) 성공 시 결과 반환, 실패 시 throw → caller가 mock으로 폴백
  throw new Error('NOT_IMPLEMENTED')
}

// --- 콘텐츠 생성 -------------------------------------------------------------

export async function generateContent(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
): Promise<GenerateContentOutput> {
  if (!hasApiKey()) {
    console.warn('[ai] mock — no API key')
    return { result: mockGeneratedContent(contentType), usedFallback: true }
  }

  try {
    const result = await withTimeout(
      callAnthropicForContent(company, analysis, contentType),
      AI_TIMEOUT_MS,
    )
    return { result, usedFallback: false }
  } catch (e) {
    console.error('[ai] mock — content generation failed:', e)
    return { result: mockGeneratedContent(contentType), usedFallback: true }
  }
}

async function callAnthropicForContent(
  _company: CompanyInput,
  _analysis: SdgAnalysisResult,
  _contentType: ContentType,
): Promise<GeneratedContent> {
  // TODO(PR 4): 후속 PR에서 채움 (analyzeSdg와 동일 패턴)
  throw new Error('NOT_IMPLEMENTED')
}

// --- Public types (re-export) -----------------------------------------------

export type { CompanyInput } from './prompts'
export type {
  ContentType,
  GeneratedContent,
  SdgAnalysisResult,
} from './schemas'
