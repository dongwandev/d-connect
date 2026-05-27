/**
 * 시스템 프롬프트 / 사용자 프롬프트 빌더.
 *
 * 실제 프롬프트 본문은 다음 회의에서 SDGs 키워드 사전이 확정된 후 채운다.
 * 본 PR은 시그니처만 — 호출자가 안전하게 import할 수 있도록 placeholder를 export.
 */

import type { SdgAnalysisResult } from '../schemas'

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

// SDGs 분석용 프롬프트 -------------------------------------------------------
export function buildSdgAnalysisPrompt(_company: CompanyInput): string {
  // TODO: 후속 PR에서 채움 — 공공홍보 톤 가드 + few-shot + SDGs 4종 정의
  return ''
}

// 콘텐츠 생성용 프롬프트 ------------------------------------------------------
export function buildContentGenerationPrompt(
  _company: CompanyInput,
  _analysis: SdgAnalysisResult,
  _contentType: string,
): string {
  // TODO: 후속 PR에서 채움 — 콘텐츠 유형별 톤 가이드 + few-shot
  return ''
}
