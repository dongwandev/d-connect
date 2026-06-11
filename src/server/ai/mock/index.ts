/**
 * Mock 응답 데이터.
 *
 * API 키 부재 / 호출 실패 / 타임아웃 / 스키마 검증 실패 시 사용된다 (PRD §5.2).
 * 유형별 산출물 정책(#92)을 따른다 — 숏폼·포스터는 영어 생성 프롬프트 포함.
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

const MOCK_CONTENT: Record<ContentType, Omit<GeneratedContent, 'type'>> = {
  SNS_POST: {
    body:
      '저희 가게는 지난주부터 일회용 컵을 줄이기 위한 작은 캠페인을 시작했어요. ☕\n' +
      '한 잔의 다회용 컵이 하나의 습관이 되고, 그 습관이 동네를 바꿉니다.\n' +
      '방문하실 때 텀블러를 가져오시면 함께하는 분들이 늘어날수록 동네의 변화도 커질 거예요.',
    hashtags: ['지역상생', '환경캠페인', '일회용품저감', '다회용컵', '동네가게'],
    imagePrompt:
      'A reusable cup on a small cafe counter in a Korean neighborhood, warm morning light, minimal photography style, soft colors',
  },
  CARD_NEWS: {
    body:
      '[1장] 우리 동네 카페가 일회용 컵 줄이기에 나섰습니다.\n' +
      '[2장] 다회용 컵 사용 고객에게는 소소한 혜택을 드리고 있습니다.\n' +
      '[3장] 작은 실천이 모이면 동네의 쓰레기가 줄어듭니다.\n' +
      '[4장] 지속가능한 소비, 우리 동네에서 시작할 수 있습니다.',
    hashtags: ['카드뉴스', '환경캠페인', '책임있는소비'],
    imagePrompt:
      'Flat illustration of a cozy Korean local cafe exterior with a reusable cup motif, pastel green palette, clean card news cover style',
  },
  SHORT_VIDEO_SCRIPT: {
    body:
      '영상 의도: 동네 카페의 일회용품 저감 캠페인을 차분한 일상 톤으로 보여줍니다.\n' +
      '구성: ① 아침의 카페 외관 ② 다회용 컵에 음료를 담는 손 ③ 컵을 들고 웃는 손님 ④ 매장 앞 캠페인 안내문.\n' +
      '생성 후 자막 제안: "한 잔의 선택이 동네를 바꿉니다", "다회용 컵과 함께하는 우리 동네 카페".',
    hashtags: ['숏폼', '환경캠페인', '다회용컵'],
    imagePrompt:
      'A 20-second short-form video. Scene 1: quiet morning exterior of a small Korean neighborhood cafe, soft sunlight. Scene 2: close-up of hands pouring coffee into a reusable cup. Scene 3: a customer smiling holding the cup at an outdoor table. Scene 4: a small campaign sign about reducing disposable cups by the entrance. Warm natural color grading, calm handheld camera, space for Korean subtitles at the bottom.',
  },
  CAMPAIGN_SLOGAN: {
    body:
      '1. 한 잔의 습관이 동네를 바꿉니다 — 다회용 컵 사용 실천\n' +
      '2. 오늘의 컵, 내일의 동네 — 일회용품 줄이기 캠페인',
    hashtags: ['캠페인', '환경'],
    imagePrompt:
      'Minimal poster background with a reusable cup silhouette, soft green tones',
  },
  POSTER: {
    body:
      '[헤드라인] 한 잔의 습관이 동네를 바꿉니다\n' +
      '[서브카피] 다회용 컵과 함께하는 우리 동네 일회용품 줄이기\n' +
      '[하단 정보] 참여 문의: 동네 카페 · 대전',
    hashtags: ['포스터', '환경캠페인', '지역상생'],
    imagePrompt:
      'A public campaign poster layout for a Korean local cafe sustainability initiative. Soft flat illustration of a reusable cup surrounded by small neighborhood buildings, warm pastel green and cream palette, generous empty space at top for a headline and bottom for organizer info, no text rendered in the image.',
  },
}

export function mockGeneratedContent(type: ContentType): GeneratedContent {
  return { type, ...MOCK_CONTENT[type] }
}
