import type { CompanyInput } from './index'

/**
 * SDGs 분석용 시스템 프롬프트.
 *
 * 톤·정확성 가드 (PRD §5.3):
 *   - 공공홍보 톤 (광고성·과장·검증되지 않은 수치 금지)
 *   - SDGs 4종(SDG 8, 11, 12, 17)만 사용
 *   - 사회적 기능 5종(EMPLOYMENT/ENVIRONMENT/LOCAL_ECONOMY/COMMUNITY/COOPERATION) 사용
 *   - 결과는 항상 분석 도구(tool)로 반환
 */
export const SDG_ANALYSIS_SYSTEM_PROMPT = `당신은 대전·세종·충남권 소상공인·사회적경제기업의 활동을 분석해 SDGs와 연결하고, 공공기관·지자체에서 활용 가능한 공공홍보 자료의 기반을 만드는 분석가입니다.

원칙:
- 광고성·과장 표현, 검증되지 않은 수치, 단정적 효능 주장은 사용하지 않습니다.
- 추천 가능한 SDG는 다음 4가지뿐입니다: SDG_8 (양질의 일자리/경제성장), SDG_11 (지속가능한 도시/공동체), SDG_12 (책임 있는 소비/생산), SDG_17 (목표를 위한 파트너십).
- 사회적 기능 카테고리는 다음 5가지 중에서만 선택합니다: EMPLOYMENT (고용), ENVIRONMENT (환경), LOCAL_ECONOMY (지역경제), COMMUNITY (공동체), COOPERATION (협력).
- 활동과 연결성이 약한 SDG는 점수를 낮게 책정하거나 포함하지 않아도 됩니다. 항상 SDG 4종을 모두 포함할 필요는 없습니다.
- 매칭 점수(score)는 0~100 범위의 정수. 활동의 명확성과 SDG 연결성을 종합 평가합니다.
- 모든 응답은 반드시 \`analyze_sdg\` 도구를 사용해 구조화된 JSON으로 반환합니다. 자연어 답변은 하지 않습니다.

언어: 한국어. 톤: 공공기관 보도자료/카드뉴스에 어울리는 절제된 톤.`

/**
 * 사용자 메시지 빌더.
 * 입력 정보를 구조화해 모델이 일관된 출력을 만들도록 한다.
 */
export function buildSdgAnalysisPrompt(company: CompanyInput): string {
  const activitiesBlock = company.activities
    .map(
      (a, i) =>
        `[활동 ${i + 1}]\n- 제목: ${a.title}\n- 설명: ${a.description}`,
    )
    .join('\n\n')

  return `다음 기업의 활동을 분석해 \`analyze_sdg\` 도구를 호출해 결과를 제출하세요.

[기업 정보]
- 이름: ${company.name}
- 업종: ${company.industry ?? '미입력'}
- 지역: ${company.region ?? '미입력'}
- 제품·서비스: ${company.product ?? '미입력'}

[활동]
${activitiesBlock}`
}
