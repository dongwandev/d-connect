/**
 * 시스템 프롬프트 / 사용자 프롬프트 빌더.
 *
 * 각 분석 종류별로 파일을 분리한다.
 *   - sdg-analysis.ts — SDGs 분석 (구현됨)
 *   - content-generation — 콘텐츠 생성 (TODO)
 */

import type { SdgAnalysisResult } from '../schemas'

/**
 * 분석·생성 함수가 공통으로 받는 기업 입력.
 */
export interface CompanyInput {
  name: string
  industry?: string | null
  region?: string | null
  product?: string | null
  activities: ReadonlyArray<{
    title: string
    description: string
  }>
}

// SDGs 분석 — sdg-analysis.ts에 본문 구현. 호출자는 이쪽에서 가져올 것:
export {
  SDG_ANALYSIS_SYSTEM_PROMPT,
  buildSdgAnalysisPrompt,
} from './sdg-analysis'

// 콘텐츠 생성용 프롬프트 — 후속 PR에서 별도 파일로 분리 + 구현
export function buildContentGenerationPrompt(
  _company: CompanyInput,
  _analysis: SdgAnalysisResult,
  _contentType: string,
): string {
  // TODO: 후속 PR에서 채움 — 콘텐츠 유형별 톤 가이드 + few-shot
  return ''
}
