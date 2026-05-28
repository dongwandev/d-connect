import type { ContentType } from '@/lib/enums'
import type { SdgAnalysisResult } from '../schemas'
import type { CompanyInput } from './index'

/**
 * 콘텐츠 생성용 시스템 프롬프트 + 빌더.
 *
 * 톤·정확성 가드 (PRD §5.3):
 *   - 공공홍보 톤 — 광고성·과장·검증되지 않은 수치 금지
 *   - 항상 generate_content 도구로 반환
 *   - 한국어, 카드뉴스/SNS/숏폼/슬로건 등 매체별 길이 적절
 */
export const CONTENT_GENERATION_SYSTEM_PROMPT = `당신은 대전·세종·충남권 소상공인·사회적경제기업의 SDGs 분석 결과를 토대로, 공공기관·지자체가 그대로 활용할 수 있는 공공홍보 콘텐츠를 작성하는 카피라이터입니다.

원칙:
- 광고성·과장 표현, 검증되지 않은 수치, 단정적 효능 주장은 사용하지 않습니다.
- 사용자가 입력한 활동·매칭 SDG·사회적 기능을 근거로만 작성합니다.
- 콘텐츠 유형(아래)별로 톤·길이·형식을 다르게 합니다.
- 모든 응답은 반드시 \`generate_content\` 도구로 구조화된 JSON으로 반환합니다. 자연어 답변 금지.

콘텐츠 유형 가이드:
- SNS_POST (SNS 게시글): 친근하고 짧은 단락. 본문 200~400자. 해시태그 5~8개.
- CARD_NEWS (카드뉴스 문안): 3~5장 슬라이드 형태로 줄바꿈 분리. 슬라이드별 1~2문장. 본문 400~700자.
- SHORT_VIDEO_SCRIPT (숏폼 영상 대본): 장면 4~6개. 각 장면에 시간/대사/이미지 묘사. 본문 500~800자.
- CAMPAIGN_SLOGAN (캠페인 슬로건): 2~3개 후보 슬로건. 각 슬로건 한 줄 + 짧은 부연.

언어: 한국어. 톤: 공공기관 보도자료/카드뉴스에 어울리는 절제된 톤.`

const CONTENT_TYPE_LABEL_KO: Record<ContentType, string> = {
  SNS_POST: 'SNS 게시글',
  CARD_NEWS: '카드뉴스 문안',
  SHORT_VIDEO_SCRIPT: '숏폼 영상 대본',
  CAMPAIGN_SLOGAN: '캠페인 슬로건',
}

export function buildContentGenerationPrompt(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
): string {
  const matchesBlock = analysis.matches
    .map(
      (m) =>
        `- ${m.sdg} (점수 ${m.score}): ${m.rationale}\n  키워드: ${m.keywords.join(', ')}`,
    )
    .join('\n')

  const activitiesBlock = company.activities
    .map((a, i) => `[활동 ${i + 1}] ${a.title} — ${a.description}`)
    .join('\n')

  return `다음 정보를 바탕으로 ${CONTENT_TYPE_LABEL_KO[contentType]} 1건을 생성해 \`generate_content\` 도구로 제출하세요.

[기업]
- 이름: ${company.name}
- 업종: ${company.industry ?? '미입력'}
- 지역: ${company.region ?? '미입력'}
- 제품·서비스: ${company.product ?? '미입력'}

[활동]
${activitiesBlock}

[SDGs 분석]
- 사회적 기능: ${analysis.socialFunctions.join(', ')}
- 공공적 의미: ${analysis.publicMeaning}
- 매칭:
${matchesBlock}

[요청 유형]
${contentType} (${CONTENT_TYPE_LABEL_KO[contentType]})`
}
