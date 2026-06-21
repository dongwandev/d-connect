import {
  BODY_LENGTH_LABEL,
  CARD_DENSITY_LABEL,
  CONTENT_TYPE_LABEL,
  IMAGE_STYLE_LABEL,
  POSTER_TEXT_AMOUNT_LABEL,
  POSTER_USAGE_LABEL,
  POST_TONE_LABEL,
  SDG_GOAL_LABEL,
  SNS_PLATFORM_LABEL,
  VIDEO_MOOD_LABEL,
  type ContentType,
  type GenerationOptions,
  type GenerationOptionsStored,
  type ImageStyle,
  type SdgGoal,
  type SnsPlatform,
} from '@/lib/enums'
import type { SdgAnalysisResult } from '../schemas'
import { buildCompanyBlock, type CompanyInput } from './index'

/**
 * 콘텐츠 생성용 시스템 프롬프트 + 빌더 (#92 개편).
 *
 * 파이프라인: 사용자가 분석 매칭 중 홍보할 SDG 1개와 콘텐츠 유형을 선택 →
 * 선택 SDG를 중심 메시지로 콘텐츠 1건 생성.
 *
 * 산출물 정책:
 *   - SNS_POST / CARD_NEWS — 바로 쓰는 한국어 완성형
 *   - SHORT_VIDEO_SCRIPT(숏폼 생성 프롬프트) / POSTER — 외부 생성형 AI에 붙여넣는
 *     **영어 프롬프트(imagePrompt 필드)** + 한국어 안내·문구(body 필드)
 *
 * 톤·정확성 가드 (PRD §5.3): 광고성·과장·검증되지 않은 수치 금지.
 */
export const CONTENT_GENERATION_SYSTEM_PROMPT = `당신은 대전·세종·충남권 소상공인·사회적경제기업의 SDGs 분석 결과를 토대로, 공공기관·지자체가 그대로 활용할 수 있는 공공홍보 콘텐츠를 작성하는 카피라이터입니다.

[범위]
- 사용자가 입력한 활동·매칭 SDG·사회적 기능·공공적 의미를 근거로만 작성합니다.
- 입력에 없는 사실은 추론하거나 만들어내지 않습니다.
- [홍보 대상 SDG]로 지정된 목표를 콘텐츠의 중심 메시지로 삼습니다. 다른 매칭 SDG는 배경 맥락으로만 참고하고 본문에서 나열하지 않습니다.
- [홍보 타겟]과 [홍보 목표]가 주어지면 어조·소재 선택에 반영합니다 (예: 타겟이 청년이면 활동의 청년 관련 측면을 앞세움). 단, 타겟에 맞춘다는 이유로 광고 톤이 되어서는 안 됩니다.

[톤·정확성 가드] (PRD §5.3, 절대 위반 금지)
1. **광고성·과장 표현 금지** — 다음 패턴은 본문·해시태그·생성 프롬프트 어디에도 사용하지 않습니다:
   - 최상급/유일성: "최고의", "최초의", "유일한", "독보적", "압도적", "역대급", "전례 없는", "선도적"
   - 과장 수식: "혁신적인", "획기적인", "타의 추종을 불허", "단연", "초유의"
   - 강한 권유: "지금 바로!", "놓치면 후회", "이번 기회"
2. **수치 환각 금지** — 입력에 명시된 구체 수치만 인용. 입력에 없는 통계·비율·인원수·금액·기간은 생성하지 않습니다.
   - 입력에 수치가 없으면 "다수", "꾸준히", "여러" 같은 모호한 표현으로 우회.
3. **단정적 효능 회피** — 가능성/기여 표현으로:
   - X "~한 효과가 있다", "~를 해결한다", "~을 보장한다"
   - O "~에 기여한다", "~할 수 있다", "~을 모색한다", "~기대된다"
4. **허위 사실 회피** — 수상 이력, 인증, 협력 기관, 매출 등 입력에 없는 사실은 만들지 않습니다.
5. **출력 형식** — 반드시 \`generate_content\` 도구로 구조화된 JSON 반환. 자연어 답변·도구 외 출력 금지.

[콘텐츠 유형별 산출물]
- SNS_POST (SNS 게시글) — 완성형 텍스트:
  - body: 바로 게시 가능한 본문 200~400자. 친근하고 짧은 단락. 이모지 1~3개 절제 사용. ~해요체 허용, 광고 톤 금지.
  - hashtags: 5~8개.
  - imagePrompt: 게시글에 곁들일 이미지 1장의 영어 생성 프롬프트 (선택).
- CARD_NEWS (카드뉴스 문안) — 완성형 텍스트 + 장별 카드 생성 프롬프트:
  - body: 3~5장 슬라이드. "[1장]" 형식 표기 후 줄바꿈 분리, 슬라이드별 1~2문장, 총 400~700자. 슬라이드마다 하나의 명확한 사실 정보.
  - hashtags: 3~6개.
  - imagePrompt (**필수**): body의 각 장과 1:1 대응하는 "Card 1:" ~ "Card N:" 블록. 각 블록은 이미지 생성 AI에 단독으로 붙여넣으면 그 장의 한글 문구가 렌더링된 1:1 정사각 카드 1장이 나오는 완전한 프롬프트.
- SHORT_VIDEO_SCRIPT (숏폼 생성 프롬프트) — 영상 생성 AI용:
  - imagePrompt (**필수**): Sora·Veo·Runway 등 영상 생성 AI에 그대로 붙여넣는 **영어** 프롬프트. 15~30초 분량의 장면 구성(shot-by-shot), 카메라 움직임, 분위기, 색감, 자막 삽입 위치를 포함. 실존 인물·브랜드 로고 묘사 금지.
  - body: 한국어 안내 — 영상의 의도, 장면별 구성 요약, 생성 후 덧붙일 자막 문구(한국어) 제안. 300~500자.
  - hashtags: 영상 게시 시 쓸 해시태그 3~6개.
- POSTER (포스터) — 이미지 생성 AI용 (한글 문구 포함 완성형):
  - imagePrompt (**필수**): 최신 이미지 생성 AI(gpt-image-2, ChatGPT 등)에 붙여넣으면 **한글 문구까지 렌더링된 완성 포스터**가 나오는 프롬프트. 장면 묘사(영어) + Typography layout 섹션(body의 문구를 따옴표로 정확히 인용 + 배치·서체 위계 지시)으로 구성. 한글 정확성 가드 문장 필수.
  - body: 포스터에 들어갈 한국어 문구 — 헤드라인 1줄, 서브카피 1~2줄, 하단 정보(기업명·지역) 형식으로 구분 표기. imagePrompt의 인용 문구와 동일해야 함.
  - hashtags: 게시 시 쓸 해시태그 3~6개.

[영어 프롬프트 작성 규칙] (SHORT_VIDEO_SCRIPT·POSTER·CARD_NEWS의 imagePrompt)
- **[홍보 대상 SDG]가 이미지의 중심 테마다.** SDG별 시각 서사:
  - SDG_8 (일자리·경제성장): 교육받고 → 성장하고 → 일하는 사람의 서사. 강의·멘토링 장면, 일터에서 자신감 있게 일하는 모습, 상승 그래프 모티프. 환경 상징 금지.
  - SDG_11 (도시·공동체): 동네 골목·시장·공공 공간에서 주민들이 어울리는 장면.
  - SDG_12 (책임 소비·생산): 재사용·리필·업사이클·자원순환의 구체적 행동 장면.
  - SDG_17 (파트너십): 서로 다른 주체(기업·기관·주민)가 함께 일하는 협력 장면.
  - ⚠️ 새싹·지구본·풍력터빈 같은 범용 '지속가능' 상징은 중심 메시지가 환경일 때만. body에 "지속 가능한"이라는 단어가 있다는 이유로 환경 비주얼을 넣지 말 것.
- **범용 일러스트 금지 — 활동의 실제 장면을 그려라**: [활동] 중 홍보 대상 SDG와 가장 맞는 활동 하나를 골라 그 현장을 구체적으로 묘사 (예: 부트캠프 교육이면 강의실에서 코드를 배우는 수강생과 멘토). 입력에 없는 사실(특정 인물 수, 실제 매장 외관 등)은 일반화해 표현.
- **body와 한 몸**: imagePrompt는 body(헤드라인·서브카피·자막)가 말하는 메시지를 장면으로 번역한 것이어야 한다.
- **한국 맥락 명시**: 인물·배경에 "Korean young adults", "in Daejeon, South Korea" 등 한국임을 반드시 명시 — 명시하지 않으면 이미지 모델이 서구권 인물·도시를 그린다. 기업의 지역 정보가 있으면 도시명을 포함.
- **장면 묘사에 고유명사 금지**: 과정명·기업명·캠페인명을 장면 묘사에 따옴표로 넣지 말 것 — 이미지 모델이 의도치 않은 간판·현수막으로 그려 넣는다. 이름 없이 장면으로만 묘사하라 (예: "'데이터 탐험가 과정'" 대신 "a data analysis bootcamp class"). 렌더링할 문구는 오직 POSTER의 Typography layout 섹션에서만 정확히 인용한다 (SHORT_VIDEO_SCRIPT는 영상에 글자를 넣지 않는다 — 자막은 body가 담당).
- **로고·실존 인물 묘사 금지**: 기업 로고를 그리라고 지시하지 말 것 — 이미지 모델은 실제 로고를 모르므로 가짜 로고를 만들어낸다. 실존 인물 묘사도 금지. 일반화된 장면·인물로만.
- 과장된 연출("epic", "dramatic", "best")보다 따뜻하고 절제된 공공 캠페인 무드.

언어: body·hashtags는 한국어, 영어 프롬프트 지시가 있는 필드만 영어. 톤: 공공기관 보도자료·카드뉴스의 절제된 ~합니다체 (SNS_POST는 ~해요체 일부 허용).`

/**
 * 유형별 출력 체크리스트 — 시스템 프롬프트의 가이드를 사용자 메시지에서
 * 한 번 더 강제한다 (경량 모델이 긴 시스템 프롬프트의 형식 지시를
 * 누락하는 것을 실측으로 확인 — gpt-4o-mini, #92).
 */
const TYPE_REQUIREMENTS: Record<ContentType, string> = {
  SNS_POST:
    '- body: 바로 게시 가능한 한국어 본문 200~400자, 이모지 1~3개\n- hashtags(필수): 5~8개, # 기호 제외\n- imagePrompt(선택): 곁들일 이미지 1장의 영어 프롬프트',
  CARD_NEWS:
    `- body: 반드시 "[1장]" "[2장]" 표기로 [세부 설정]의 카드 수만큼 정확히 분리 (더 적거나 많으면 안 됨), 슬라이드별 1~2문장
- hashtags(필수): 3~6개, # 기호 제외
- imagePrompt(필수): body의 장 수와 동일한 개수의 "Card 1:" ~ "Card N:" 블록 (줄바꿈 2번으로 구분). **각 블록은 단독으로 이미지 생성 AI에 붙여넣어도 완전하도록** 다음을 모두 포함:
  · [세부 설정]의 비율을 카드 규격으로 명시 (예: "A 1:1 square card-news slide..." — 비율이 다르면 그에 맞게)
  · 그 장의 내용을 시각화한 장면(영어) — [영어 프롬프트 작성 규칙] 준수, 해당 장이 말하는 활동·사실을 그릴 것
  · 그 장의 body 문구를 따옴표로 **한 글자도 바꾸지 말고 인용** — Card N의 인용 문구는 body의 [N장] 문구와 정확히 동일해야 하며, 요약·재작성·새 문장 생성 금지 ("[1장]" 같은 장 라벨만 제외). 배치 지시: Card 1은 표지 — 큰 제목 스타일, 2장부터는 상단 또는 하단 텍스트 영역
  · 세트 일관성: 모든 카드에 동일한 스타일 문장 반복 ("Consistent flat illustration style and the same warm color palette across all cards in this set.")
  · 한글 가드: "Render the Korean text EXACTLY as written with correct Hangul glyphs. No other text or lettering in the image."`,
  SHORT_VIDEO_SCRIPT:
    '- imagePrompt(필수, 영어): 반드시 "Scene 1:", "Scene 2:" 형식으로 4~6개 장면을 나눈 15~30초 영상 생성 프롬프트. 각 장면에 카메라 움직임·분위기·피사체를 구체적으로. 인물·배경은 한국임을 명시(Korean ...). body의 자막 문구가 말하는 내용과 장면이 일치해야 함. 전체 영상의 색감·자막 위치로 마무리\n- body: 한국어 안내 — 영상 의도, 장면 구성 요약, 생성 후 얹을 한국어 자막 문구 제안\n- hashtags(필수): 영상 게시 시 쓸 해시태그 3~6개, # 기호 제외',
  CAMPAIGN_SLOGAN: '- body: 슬로건 2~3개 후보, 각 한 줄 + 짧은 부연',
  POSTER:
    `- body: 반드시 "[헤드라인]" 1줄 / "[서브카피]" 1~2줄 / "[하단 정보]" 형식의 세 구획으로만 구성 (해시태그는 body에 넣지 말 것)
- hashtags(필수): 포스터 게시·아카이브용 해시태그 3~6개, # 기호 제외 — body가 아닌 hashtags 필드에 담을 것
- imagePrompt(필수): 한글 문구가 포함된 완성 포스터를 한 번에 생성하는 프롬프트. 두 부분으로 구성:
  ① 장면(영어): [홍보 대상 SDG]의 시각 서사를 중심 테마로, [활동] 중 그 SDG와 맞는 활동의 실제 현장 ([영어 프롬프트 작성 규칙] 준수). 인물·배경은 한국임을 명시(Korean ..., 지역명). [세부 설정]의 비율을 포스터 규격으로 명시하고 구도·색감·스타일 포함.
  ② Typography layout 섹션: body의 세 구획 문구를 **한 글자도 바꾸지 말고 따옴표로 정확히 인용**해 배치 지시. 단, "[헤드라인]" "[서브카피]" "[하단 정보]" 같은 구획 라벨은 body 표기용일 뿐이므로 **인용에서 제외하고 문구만** 넣는다 (라벨이 들어가면 이미지에 그대로 그려진다) — TOP: 헤드라인(large bold white Korean text on a soft dark overlay band) / BOTTOM: 서브카피(medium white, centered) / BOTTOM EDGE: 하단 정보(small, light gray, below a thin divider). 반드시 다음 가드 문장들을 포함: "render all Korean text EXACTLY as written, character by character, with correct and complete Hangul glyphs — do not translate, alter, or add any other text" 그리고 "The image must contain ONLY these Korean text blocks — no English words, no watermarks, no other lettering anywhere."`,
}

/** 플랫폼별 작성 가이드 — body 분량·해시태그·어조에 반영 (#104) */
const PLATFORM_GUIDE: Record<SnsPlatform, string> = {
  INSTAGRAM:
    '인스타그램 — 이모지·해시태그 친화적, 첫 문장으로 시선을 끌 것, 줄바꿈으로 가독성 확보',
  FACEBOOK:
    '페이스북 — 차분한 설명형 톤 허용, 본문이 다소 길어도 좋음, 해시태그는 3~5개로 절제',
  X: 'X(트위터) — **본문 전체를 280자 이내로 반드시 제한** (초과 금지). 핵심 한 문장 + 보조 한두 문장. 해시태그 1~3개만',
  TIKTOK:
    '틱톡 — 숏폼 영상 친화적, 첫 1~2초에 시선을 끄는 후킹 문구로 시작, 트렌디하고 캐주얼한 어조, 짧고 임팩트 있는 본문 + 트렌드성 해시태그 위주',
  THREADS:
    '스레드 — X와 유사한 대화형의 가벼운 톤이나 본문은 500자 이내 권장, 인스타그램 연계 일상적 어조, 해시태그 1~3개',
  OTHER: '플랫폼 불특정 — 범용 톤, 기본 분량 가이드 준수',
}

const IMAGE_STYLE_PROMPT: Record<ImageStyle, string> = {
  ILLUSTRATION: 'warm flat illustration style',
  PHOTO: 'realistic photography style, natural lighting',
  WATERCOLOR: 'soft watercolor painting style',
  MINIMAL: 'minimal clean design with generous whitespace',
}

const BODY_LENGTH_GUIDE: Record<NonNullable<GenerationOptionsStored['bodyLength']>, string> =
  {
    SHORT: 'body를 150~250자로 짧고 간결하게',
    NORMAL: 'body를 250~400자로',
    LONG: 'body를 400~600자로 배경·맥락까지 충분히',
  }

const DENSITY_GUIDE: Record<NonNullable<GenerationOptionsStored['density']>, string> =
  {
    SUMMARY: '슬라이드당 핵심 1문장으로 간결하게',
    DETAILED: '슬라이드당 2~3문장으로 배경·맥락까지 상세하게',
  }

const TEXT_AMOUNT_GUIDE: Record<NonNullable<GenerationOptionsStored['textAmount']>, string> =
  {
    MINIMAL: '헤드라인 중심으로 문구를 최소화하고 비주얼을 강조',
    STANDARD: '헤드라인 + 서브카피의 표준 분량',
    INFOGRAPHIC: '핵심 정보를 여러 항목으로 구조화해 정보 전달을 강조',
  }

/**
 * [세부 설정] 블록 — 유형 공통 요구사항보다 우선 적용된다 (#123).
 * GenerationOptionsStored의 필드를 존재할 때만 한 줄씩 추가한다 (유형별 특화).
 */
function buildOptionsBlock(
  contentType: ContentType,
  options: GenerationOptionsStored,
): string {
  const lines: string[] = []

  // 공통 — 존재하는 경우만 (POSTER엔 platform 없음, SNS_POST는 이미지 미포함 시 비율/스타일 없음)
  if (options.platform) {
    lines.push(
      `- 대상 SNS: ${SNS_PLATFORM_LABEL[options.platform]} — ${PLATFORM_GUIDE[options.platform]}`,
    )
  }
  if (options.aspectRatio) {
    lines.push(
      `- 비율: ${options.aspectRatio} — imagePrompt의 모든 이미지/영상 규격에 이 비율을 명시할 것 (예: "${options.aspectRatio} aspect ratio")`,
    )
  }
  if (options.imageStyle) {
    lines.push(
      `- 이미지 스타일: ${IMAGE_STYLE_LABEL[options.imageStyle]} — imagePrompt의 스타일 문장은 "${IMAGE_STYLE_PROMPT[options.imageStyle]}" 계열로 통일`,
    )
  }

  // CARD_NEWS
  if (contentType === 'CARD_NEWS' && options.slideCount) {
    lines.push(
      `- 카드 수: 정확히 ${options.slideCount}장 — body는 [1장]~[${options.slideCount}장], imagePrompt는 Card 1~Card ${options.slideCount}`,
    )
  }
  if (options.density) {
    lines.push(
      `- 정보 밀도: ${CARD_DENSITY_LABEL[options.density]} — ${DENSITY_GUIDE[options.density]}`,
    )
  }
  if (options.closingCard === true) {
    const n = options.slideCount
    const split = n
      ? ` 앞 ${n - 1}개 장은 정보 전달, 마지막 ${n}번째 장만 마무리.`
      : ''
    lines.push(
      `- 마무리 장: 포함 — 마지막 장을 정보 카드가 아닌 **마무리(CTA) 카드**로 구성한다. 활동의 출처·문의처·참여 방법(후원·방문·SNS 팔로우 등) 중 입력 근거가 있는 것만 담고, 앞 장들과 구분되는 마감 톤으로 작성한다 (예: "함께해요", "더 알아보기").${split} 이 장의 body 문구와 imagePrompt(Card ${n ?? 'N'})도 정보 카드가 아닌 안내·행동유도 카드로 작성한다.`,
    )
  } else if (options.closingCard === false) {
    lines.push(
      '- 마무리 장: 미포함 — 모든 장을 정보 전달 카드로 구성한다. 출처·문의·참여 안내 등 별도의 마무리(CTA) 카드를 만들지 않는다 (마지막 장도 활동 정보).',
    )
  }

  // SNS_POST
  if (options.bodyLength) {
    lines.push(
      `- 본문 길이: ${BODY_LENGTH_LABEL[options.bodyLength]} — ${BODY_LENGTH_GUIDE[options.bodyLength]} 작성`,
    )
  }
  if (options.tone) {
    const toneGuide =
      options.tone === 'CASUAL'
        ? '~해요체의 친근한 어조 (단, 광고 톤 금지)'
        : '~합니다체의 정중한 어조'
    lines.push(`- 어조: ${POST_TONE_LABEL[options.tone]} — ${toneGuide}`)
  }
  if (options.withImage === false) {
    lines.push(
      '- 곁들일 이미지: 없음 — imagePrompt는 비우고 body·hashtags 텍스트만 작성',
    )
  } else if (options.withImage === true) {
    lines.push(
      '- 곁들일 이미지: 포함 — 게시글에 어울리는 이미지 1장의 영어 imagePrompt도 작성',
    )
  }

  // SHORT_VIDEO_SCRIPT
  if (options.videoDuration) {
    lines.push(
      `- 영상 길이: 약 ${options.videoDuration}초 — 전체 씬 구성을 이 길이에 맞출 것`,
    )
  }
  if (options.sceneCount) {
    lines.push(
      `- 씬 수: 정확히 ${options.sceneCount}개 — imagePrompt를 Scene 1~Scene ${options.sceneCount}으로 구성`,
    )
  }
  if (options.subtitles === true) {
    lines.push(
      '- 자막: 포함 — 각 씬에 얹을 한국어 자막 문구를 body에 씬별로 제시하고, imagePrompt에 자막 영역 위치를 명시',
    )
  } else if (options.subtitles === false) {
    lines.push(
      '- 자막: 없음 — 자막 없이 영상 비주얼과 장면 흐름 중심으로 구성',
    )
  }
  if (options.mood) {
    lines.push(
      `- 영상 분위기: ${VIDEO_MOOD_LABEL[options.mood]} — 색감·편집 호흡·음악 분위기를 여기에 맞출 것`,
    )
  }

  // POSTER
  if (options.usage) {
    const usageGuide =
      options.usage === 'PRINT'
        ? '고해상도, 여백·가독성 우선, 과한 효과 자제'
        : '썸네일에서도 헤드라인이 읽히도록 대비 강조'
    lines.push(`- 포스터 용도: ${POSTER_USAGE_LABEL[options.usage]} — ${usageGuide}`)
  }
  if (options.textAmount) {
    lines.push(
      `- 텍스트 양: ${POSTER_TEXT_AMOUNT_LABEL[options.textAmount]} — ${TEXT_AMOUNT_GUIDE[options.textAmount]}`,
    )
  }

  // 공통 — 자유 요청
  if (options.extraRequest) {
    lines.push(
      `- 추가 요청: ${options.extraRequest} (톤·정확성 가드를 어기지 않는 범위에서 반영)`,
    )
  }

  return lines.join('\n')
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  platform: 'OTHER',
  aspectRatio: '1:1',
  imageStyle: 'ILLUSTRATION',
}

export function buildContentGenerationPrompt(
  company: CompanyInput,
  analysis: SdgAnalysisResult,
  contentType: ContentType,
  focusSdg: SdgGoal,
  options: GenerationOptionsStored = DEFAULT_GENERATION_OPTIONS,
): string {
  const focusMatch = analysis.matches.find((m) => m.sdg === focusSdg)
  const otherMatches = analysis.matches.filter((m) => m.sdg !== focusSdg)

  const focusBlock = focusMatch
    ? `- ${SDG_GOAL_LABEL[focusMatch.sdg]} (매칭 점수 ${focusMatch.score})\n- 근거: ${focusMatch.rationale}\n- 키워드: ${focusMatch.keywords.join(', ')}`
    : `- ${SDG_GOAL_LABEL[focusSdg]}`

  const othersBlock = otherMatches.length
    ? otherMatches
        .map((m) => `- ${m.sdg} (점수 ${m.score}): ${m.rationale}`)
        .join('\n')
    : '- 없음'

  const activitiesBlock = company.activities
    .map((a, i) => `[활동 ${i + 1}] ${a.title} — ${a.description}`)
    .join('\n')

  return `다음 정보를 바탕으로 ${CONTENT_TYPE_LABEL[contentType]} 1건을 생성해 \`generate_content\` 도구로 제출하세요.

[기업]
${buildCompanyBlock(company)}

[활동]
${activitiesBlock}

[홍보 대상 SDG] ← 이 목표를 중심 메시지로
${focusBlock}

[참고 — 그 외 매칭 SDG (본문에 나열하지 말 것)]
${othersBlock}

[SDGs 분석 요약]
- 사회적 기능: ${analysis.socialFunctions.join(', ')}
- 공공적 의미: ${analysis.publicMeaning}

[요청 유형]
${contentType} (${CONTENT_TYPE_LABEL[contentType]})

[세부 설정 — 아래 출력 요구사항과 충돌하면 이 설정이 우선]
${buildOptionsBlock(contentType, options)}

[이 유형의 출력 요구사항 — 반드시 준수]
${TYPE_REQUIREMENTS[contentType]}

[톤 리마인더 — sampling에서 가장 자주 어긴 패턴 (#110)]
- "해결합니다/해결한다/만듭니다/조성합니다" 같은 단정 서술 금지 → "~에 기여합니다", "~을 돕습니다", "개선에 힘씁니다"로
- 입력이 "지원한다"고 표현한 활동을 출력에서 "직접 해낸다"로 격상하지 말 것 (기업의 역할 범위를 입력 그대로 유지)
- 본문 어미: SNS_POST만 ~해요체 허용, CARD_NEWS·POSTER·SHORT_VIDEO_SCRIPT 본문·문구는 ~합니다체`
}
