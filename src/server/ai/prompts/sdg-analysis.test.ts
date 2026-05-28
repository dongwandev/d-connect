import { describe, expect, it } from 'vitest'
import {
  SDG_ANALYSIS_SYSTEM_PROMPT,
  buildSdgAnalysisPrompt,
} from './sdg-analysis'

describe('SDG_ANALYSIS_SYSTEM_PROMPT', () => {
  it('SDG 4종을 정확히 포함한다', () => {
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('SDG_8')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('SDG_11')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('SDG_12')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('SDG_17')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).not.toContain('SDG_1 ')
  })

  it('사회적 기능 5종을 정확히 포함한다', () => {
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('EMPLOYMENT')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('ENVIRONMENT')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('LOCAL_ECONOMY')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('COMMUNITY')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('COOPERATION')
  })

  it('광고성/과장 금지 가드를 포함한다', () => {
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('광고성')
    expect(SDG_ANALYSIS_SYSTEM_PROMPT).toContain('과장')
  })
})

describe('buildSdgAnalysisPrompt', () => {
  it('기업명·활동 정보를 포함한다', () => {
    const prompt = buildSdgAnalysisPrompt({
      name: '동네 친환경 카페',
      industry: '카페·음료',
      region: '대전',
      product: '원두 직배전 커피',
      activities: [
        {
          title: '다회용 컵 캠페인',
          description: '지난주부터 다회용 컵 사용 시 500원 할인 캠페인 시작.',
        },
      ],
    })

    expect(prompt).toContain('동네 친환경 카페')
    expect(prompt).toContain('카페·음료')
    expect(prompt).toContain('대전')
    expect(prompt).toContain('다회용 컵 캠페인')
    expect(prompt).toContain('analyze_sdg')
  })

  it('미입력 필드는 "미입력"으로 표기한다', () => {
    const prompt = buildSdgAnalysisPrompt({
      name: '테스트',
      industry: null,
      region: null,
      product: null,
      activities: [{ title: '활동', description: '설명' }],
    })

    expect(prompt).toContain('미입력')
  })

  it('활동이 여러 개면 번호가 매겨진다', () => {
    const prompt = buildSdgAnalysisPrompt({
      name: '테스트',
      activities: [
        { title: '활동 A', description: '설명 A' },
        { title: '활동 B', description: '설명 B' },
        { title: '활동 C', description: '설명 C' },
      ],
    })

    expect(prompt).toContain('[활동 1]')
    expect(prompt).toContain('[활동 2]')
    expect(prompt).toContain('[활동 3]')
  })
})
