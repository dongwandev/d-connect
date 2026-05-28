/**
 * Mock 응답 데이터.
 *
 * API 키 부재 / 호출 실패 / 타임아웃 / 스키마 검증 실패 시 사용된다 (PRD §5.2).
 * 실제 시연용 mock 데이터는 후속 PR에서 더 풍부하게 채운다.
 */

import type {
  ContentType,
  GeneratedContent,
  SdgAnalysisResult,
} from '../schemas'

export function mockSdgAnalysis(): SdgAnalysisResult {
  return {
    matches: [
      {
        sdg: 'SDG_12',
        score: 85,
        keywords: ['일회용품 저감', '다회용 컵'],
        rationale:
          '입력된 활동이 책임 있는 소비 관점에서 일회용품 사용을 줄이는 방향과 직접 연결된다.',
      },
      {
        sdg: 'SDG_11',
        score: 72,
        keywords: ['지역 공동체', '동네 행사'],
        rationale: '지역 단위 캠페인이 도시 지속가능성·공동체 인식에 기여한다.',
      },
    ],
    socialFunctions: ['ENVIRONMENT', 'COMMUNITY'],
    publicMeaning:
      '지역 소상공인이 시민 인식 변화를 유도하는 환경 캠페인 사례로, 공공기관·지자체 카드뉴스·캠페인 자료에 활용 가능하다.',
  }
}

export function mockGeneratedContent(type: ContentType): GeneratedContent {
  return {
    type,
    body:
      '저희 가게는 지난주부터 일회용 컵을 줄이기 위한 작은 캠페인을 시작했습니다.\n' +
      '한 잔의 다회용 컵이 하나의 습관이 되고, 그 습관이 동네를 바꿉니다.',
    hashtags: ['#지역상생', '#환경캠페인', '#일회용품저감', '#다회용컵'],
    imagePrompt:
      '카페 카운터 위에 놓인 다회용 컵 한 잔, 따뜻한 색감, 햇살, 미니멀 사진 스타일',
  }
}
