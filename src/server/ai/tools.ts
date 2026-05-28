import type Anthropic from '@anthropic-ai/sdk'

/**
 * Tool Use 정의.
 *
 * Anthropic Messages API의 \`tools\` 파라미터에 그대로 전달한다.
 * 스키마는 docs/API.md §4.1과 src/server/ai/schemas.ts의 SdgAnalysisResultSchema와 정합되어야 한다.
 *
 * `tool_choice: { type: 'tool', name: 'analyze_sdg' }`로 모델이 반드시 이 도구를
 * 호출하도록 강제한다.
 */
/**
 * 콘텐츠 생성 Tool Use 정의.
 * 스키마는 src/server/ai/schemas.ts의 GeneratedContentSchema와 정합.
 */
export const GENERATE_CONTENT_TOOL: Anthropic.Tool = {
  name: 'generate_content',
  description:
    'Submit the generated public-relations content for a Korean local SME based on the SDGs analysis. Always call this tool instead of replying with prose.',
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['SNS_POST', 'CARD_NEWS', 'SHORT_VIDEO_SCRIPT', 'CAMPAIGN_SLOGAN'],
      },
      body: {
        type: 'string',
        description:
          '콘텐츠 본문. 유형별 권장 길이 준수. 광고성·과장 표현 금지.',
      },
      hashtags: {
        type: 'array',
        items: { type: 'string' },
        description:
          '관련 해시태그. SNS_POST는 5~8개, 그 외 유형도 적절히. # 기호 제외.',
      },
      imagePrompt: {
        type: 'string',
        description:
          '이미지 생성 도구에 그대로 입력할 수 있는 한국어 프롬프트 (배경·소품·색감·스타일).',
      },
    },
    required: ['type', 'body', 'hashtags'],
  },
}

export const ANALYZE_SDG_TOOL: Anthropic.Tool = {
  name: 'analyze_sdg',
  description:
    'Submit the structured SDGs analysis result for a Korean local SME / social enterprise. Always call this tool instead of replying with prose.',
  input_schema: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        description:
          '관련성이 있는 SDG 매칭 목록. 강한 연결만 포함. 비어 있어도 안 됨(최소 1개).',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            sdg: {
              type: 'string',
              enum: ['SDG_8', 'SDG_11', 'SDG_12', 'SDG_17'],
            },
            score: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: '활동과의 매칭 점수 (0~100 정수)',
            },
            keywords: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
              description: '활동에서 추출한 매칭 키워드 (한국어, 1~6개)',
            },
            rationale: {
              type: 'string',
              description: '왜 이 SDG와 연결되는지 한국어 1~2문장 근거',
            },
          },
          required: ['sdg', 'score', 'keywords', 'rationale'],
        },
      },
      socialFunctions: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          enum: [
            'EMPLOYMENT',
            'ENVIRONMENT',
            'LOCAL_ECONOMY',
            'COMMUNITY',
            'COOPERATION',
          ],
        },
        description: '도출된 사회적 기능 카테고리 (1~5개)',
      },
      publicMeaning: {
        type: 'string',
        description:
          '공공기관/지자체 카드뉴스·캠페인 자료에 활용 가능한 공공적 의미 요약. 2~4문장. 광고성·과장 금지.',
      },
    },
    required: ['matches', 'socialFunctions', 'publicMeaning'],
  },
}
