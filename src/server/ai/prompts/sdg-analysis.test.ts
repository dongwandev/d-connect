import { describe, expect, it } from 'vitest'
import { buildContentGenerationPrompt } from './content-generation'
import {
  SDG_ANALYSIS_SYSTEM_PROMPT,
  buildSdgAnalysisPrompt,
} from './sdg-analysis'
import type { CompanyInput } from './index'

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

const FULL_COMPANY: CompanyInput = {
  name: '동네 친환경 카페',
  foundedYear: 2021,
  businessType: '협동조합',
  industry: '식품·음료',
  region: '대전광역시 유성구',
  product: '원두 직배전 커피',
  targetAudiences: ['청년', '지역주민'],
  promoGoals: ['지역사회 인식 개선'],
  activities: [
    {
      title: '다회용 컵 캠페인',
      description: '지난주부터 다회용 컵 사용 시 500원 할인 캠페인 시작.',
    },
  ],
}

describe('buildSdgAnalysisPrompt', () => {
  it('등록 폼 전체 필드를 포함한다 (#92)', () => {
    const prompt = buildSdgAnalysisPrompt(FULL_COMPANY)

    expect(prompt).toContain('동네 친환경 카페')
    expect(prompt).toContain('2021년')
    expect(prompt).toContain('협동조합')
    expect(prompt).toContain('식품·음료')
    expect(prompt).toContain('대전광역시 유성구')
    expect(prompt).toContain('청년, 지역주민')
    expect(prompt).toContain('지역사회 인식 개선')
    expect(prompt).toContain('다회용 컵 캠페인')
    expect(prompt).toContain('analyze_sdg')
  })

  it('미입력 필드는 줄 자체를 생략한다', () => {
    const prompt = buildSdgAnalysisPrompt({
      name: '테스트',
      industry: null,
      region: null,
      product: null,
      activities: [{ title: '활동', description: '설명' }],
    })

    expect(prompt).not.toContain('미입력')
    expect(prompt).not.toContain('업종:')
    expect(prompt).not.toContain('지역:')
    expect(prompt).toContain('- 이름: 테스트')
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

describe('buildContentGenerationPrompt (#92)', () => {
  const analysis = {
    matches: [
      {
        sdg: 'SDG_12' as const,
        score: 85,
        keywords: ['일회용품 저감'],
        rationale: '책임 있는 소비와 직접 연결된다.',
      },
      {
        sdg: 'SDG_11' as const,
        score: 72,
        keywords: ['지역 공동체'],
        rationale: '공동체 인식에 기여한다.',
      },
    ],
    socialFunctions: ['ENVIRONMENT' as const],
    publicMeaning: '환경 캠페인 사례로 활용 가능하다.',
  }

  it('선택 SDG를 홍보 대상으로 강조하고 나머지는 참고로 분리한다', () => {
    const prompt = buildContentGenerationPrompt(
      FULL_COMPANY,
      analysis,
      'POSTER',
      'SDG_12',
    )

    expect(prompt).toContain('[홍보 대상 SDG]')
    expect(prompt).toContain('SDG 12')
    expect(prompt).toContain('매칭 점수 85')
    expect(prompt).toContain('[참고 — 그 외 매칭 SDG')
    expect(prompt).toContain('SDG_11 (점수 72)')
  })

  it('타겟·홍보 목표가 프롬프트에 들어간다', () => {
    const prompt = buildContentGenerationPrompt(
      FULL_COMPANY,
      analysis,
      'SNS_POST',
      'SDG_12',
    )
    expect(prompt).toContain('홍보 타겟: 청년, 지역주민')
    expect(prompt).toContain('홍보 목표: 지역사회 인식 개선')
  })

  it('유형 라벨이 요청에 표기된다', () => {
    const prompt = buildContentGenerationPrompt(
      FULL_COMPANY,
      analysis,
      'SHORT_VIDEO_SCRIPT',
      'SDG_11',
    )
    expect(prompt).toContain('숏폼 생성 프롬프트')
  })
})
