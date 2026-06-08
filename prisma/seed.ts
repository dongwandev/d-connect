/**
 * Prisma seed (개발/시연용).
 *
 * 실행:
 *   pnpm db:seed
 *
 * demo@d-connect.kr 계정에 시연용 데이터를 사전 세팅한다.
 *   - 기업 4종 (업종/사업자형태/지역 다양화)
 *   - 각 기업에 활동 2~3개 (SocialCategory 분산)
 *   - 각 기업에 SDG 분석 1건 + 매칭 3~4개 + 콘텐츠 2~3종
 *   - 일부 콘텐츠는 editedByUser=true → '편집한 콘텐츠' 통계 살림
 *
 * 멱등성:
 *   - User.upsert로 중복 실행 안전
 *   - demo 계정의 같은 이름 Company는 cascade로 삭제 후 재생성
 *   - 익명(userId=null) Company는 demo 계정에 귀속
 */

import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

// bcrypt 해시 — src/server/password.ts는 'server-only' import이라 tsx 실행 환경에서
// 직접 못 쓴다. seed는 SALT_ROUNDS만 일치시키고 bcrypt를 직접 호출.
const SALT_ROUNDS = 10

const DEMO_EMAIL = 'demo@d-connect.kr'
const DEMO_NAME = 'D-Connect 데모'
const DEMO_PASSWORD = 'demo1234!'

interface ActivitySeed {
  category:
    | 'EMPLOYMENT'
    | 'ENVIRONMENT'
    | 'LOCAL_ECONOMY'
    | 'COMMUNITY'
    | 'COOPERATION'
  title: string
  description: string
}

interface MatchSeed {
  sdg: 'SDG_8' | 'SDG_11' | 'SDG_12' | 'SDG_17'
  score: number
  keywords: string[]
  rationale: string
}

interface ContentSeed {
  type: 'SNS_POST' | 'CARD_NEWS' | 'SHORT_VIDEO_SCRIPT' | 'CAMPAIGN_SLOGAN'
  body: string
  hashtags: string[]
  imagePrompt?: string | null
  editedByUser?: boolean
}

interface CompanySeed {
  name: string
  foundedYear: number
  businessType:
    | 'INDIVIDUAL'
    | 'CORPORATION'
    | 'SOCIAL_ENTERPRISE'
    | 'COOPERATIVE'
    | 'OTHER'
  sido: 'DAEJEON' | 'SEJONG' | 'CHUNGNAM' | 'CHUNGBUK'
  sigungu: string
  industryCategory:
    | 'FOOD_BEVERAGE'
    | 'RETAIL'
    | 'SERVICE'
    | 'EDUCATION'
    | 'CULTURE_ARTS'
    | 'ENVIRONMENT_IND'
    | 'MANUFACTURING'
    | 'OTHER'
  product: string
  targetAudiences: Array<
    'ALL' | 'YOUTH' | 'FAMILY' | 'SENIOR' | 'LOCAL_RESIDENT' | 'OTHER'
  >
  promoGoals: Array<
    | 'BRAND_AWARENESS'
    | 'PRODUCT_PROMO'
    | 'SALES_GROWTH'
    | 'LOCAL_AWARENESS'
    | 'INVESTMENT'
    | 'OTHER'
  >
  activities: ActivitySeed[]
  analysis: {
    publicMeaning: string
    socialFunctions: Array<
      'EMPLOYMENT' | 'ENVIRONMENT' | 'LOCAL_ECONOMY' | 'COMMUNITY' | 'COOPERATION'
    >
    matches: MatchSeed[]
    contents: ContentSeed[]
  }
}

const COMPANIES: CompanySeed[] = [
  {
    name: '오롯 친환경 카페',
    foundedYear: 2021,
    businessType: 'SOCIAL_ENTERPRISE',
    sido: 'DAEJEON',
    sigungu: '동구',
    industryCategory: 'FOOD_BEVERAGE',
    product: '공정무역 원두 커피, 다회용 컵 대여, 지역 농산물 베이커리',
    targetAudiences: ['LOCAL_RESIDENT', 'YOUTH', 'FAMILY'],
    promoGoals: ['BRAND_AWARENESS', 'LOCAL_AWARENESS'],
    activities: [
      {
        category: 'ENVIRONMENT',
        title: '다회용 컵 보증금 시스템 운영',
        description:
          '주문 시 1,000원 보증금으로 다회용 컵을 대여하고 반납 시 환급한다. 2024년 한 해 일회용 컵 약 18,000개 절감.',
      },
      {
        category: 'LOCAL_ECONOMY',
        title: '대전 인근 6개 농가와 직거래',
        description:
          '대전·세종 인접 6개 농가에서 매주 직거래로 제철 농산물을 매입해 베이커리·디저트에 활용한다.',
      },
      {
        category: 'COMMUNITY',
        title: '청년 바리스타 양성 무료 클래스',
        description:
          '월 1회 지역 청년 6명을 모집해 바리스타 기초 클래스를 무료로 운영. 누적 수강생 48명.',
      },
    ],
    analysis: {
      publicMeaning:
        '환경 보호와 지역 경제 활성화를 카페 운영 안에 자연스럽게 녹여낸 사례. 일회용품 감축 + 농가 직거래 + 청년 일자리 연계로 SDGs 다중 임팩트.',
      socialFunctions: ['ENVIRONMENT', 'LOCAL_ECONOMY', 'EMPLOYMENT'],
      matches: [
        {
          sdg: 'SDG_12',
          score: 92,
          keywords: ['다회용 컵', '일회용품 감축', '책임감 있는 소비'],
          rationale:
            '보증금 기반 다회용 컵으로 한 해 18,000개 절감 — 책임 있는 소비·생산(SDG 12)의 모범 사례.',
        },
        {
          sdg: 'SDG_11',
          score: 85,
          keywords: ['지속가능한 도시', '지역 농가 연계', '로컬푸드'],
          rationale:
            '인근 6개 농가와의 직거래는 지역 푸드 시스템을 견고하게 만들고 (SDG 11) 푸드마일리지를 줄인다.',
        },
        {
          sdg: 'SDG_8',
          score: 74,
          keywords: ['청년 일자리', '직업 교육', '바리스타'],
          rationale:
            '월 1회 바리스타 무료 클래스는 청년의 양질의 일자리(SDG 8) 진입을 돕는다.',
        },
        {
          sdg: 'SDG_17',
          score: 60,
          keywords: ['지역 농가 파트너십', '협력'],
          rationale: '농가·청년·소비자가 연결되는 파트너십 구조(SDG 17).',
        },
      ],
      contents: [
        {
          type: 'SNS_POST',
          body: `오롯 카페의 다회용 컵, 1년 동안 18,000개의 일회용 컵을 줄였어요 ☕️💚\n\n주문 시 보증금 1,000원으로 컵을 빌리고, 반납하면 그대로 돌려드려요. 작은 선택이 모이면 큰 변화가 됩니다.\n\n오늘 한 잔, 다회용 컵에 마셔보지 않으실래요? 🌱`,
          hashtags: ['오롯카페', '다회용컵', '지속가능한소비', '대전동구카페', 'SDG12'],
          imagePrompt:
            '대전의 작은 카페 카운터에 다회용 컵 3개가 줄지어 놓여있고 따스한 조명 아래 바리스타가 미소짓는 모습',
        },
        {
          type: 'CARD_NEWS',
          body: `[카드 1] "일회용 컵 하나가 자연으로 돌아가려면 100년"\n\n[카드 2] 오롯 카페는 2021년부터 다회용 컵 보증금 시스템을 운영합니다. 1,000원 보증금, 반납 시 환급.\n\n[카드 3] 2024년 한 해 — 일회용 컵 약 18,000개 절감. 이산화탄소 환산 약 540kg 감축.\n\n[카드 4] 함께해 주신 손님들 덕분입니다. 다음 한 잔, 다회용 컵으로 어떠세요?`,
          hashtags: ['카드뉴스', '환경보호', '대전카페', '오롯카페'],
          editedByUser: true,
        },
        {
          type: 'CAMPAIGN_SLOGAN',
          body: '오롯한 한 잔, 오롯한 지구.',
          hashtags: ['오롯카페', '캠페인'],
        },
      ],
    },
  },
  {
    name: '디지털브릿지 협동조합',
    foundedYear: 2019,
    businessType: 'SOCIAL_ENTERPRISE',
    sido: 'SEJONG',
    sigungu: '조치원읍',
    industryCategory: 'EDUCATION',
    product: '중장년·시니어 대상 스마트폰·디지털 금융 교육, 청년 디지털 강사 양성',
    targetAudiences: ['SENIOR', 'YOUTH'],
    promoGoals: ['BRAND_AWARENESS', 'LOCAL_AWARENESS', 'INVESTMENT'],
    activities: [
      {
        category: 'EMPLOYMENT',
        title: '청년 디지털 강사 양성 과정',
        description:
          '20~30대 청년 12명을 디지털 강사로 양성. 수료 후 시니어 대상 교육 강사로 활동하며 안정적 일자리 연계.',
      },
      {
        category: 'COMMUNITY',
        title: '시니어 디지털 격차 해소 교육',
        description:
          '세종 6개 동·면 경로당과 협력해 스마트폰 사용·모바일 금융·키오스크 교육. 2024년 누적 수강 412명.',
      },
      {
        category: 'COOPERATION',
        title: '지역 복지관·도서관과의 공동 교육 프로그램',
        description:
          '세종시 4개 복지관·2개 도서관과 MOU를 맺고 정기 교육 프로그램 운영. 연 4분기 정규 커리큘럼.',
      },
    ],
    analysis: {
      publicMeaning:
        '디지털 격차로 소외된 시니어와 청년 일자리를 한 번에 해결하는 구조. 단순 교육이 아닌 지역 자원 연계 모델.',
      socialFunctions: ['EMPLOYMENT', 'COMMUNITY', 'COOPERATION'],
      matches: [
        {
          sdg: 'SDG_8',
          score: 90,
          keywords: ['청년 일자리', '디지털 강사', '직업 교육'],
          rationale:
            '청년 강사 양성을 통한 양질의 일자리 창출(SDG 8). 12명 수료 → 안정적 강사 활동.',
        },
        {
          sdg: 'SDG_11',
          score: 82,
          keywords: ['포용적인 도시', '디지털 격차', '시니어'],
          rationale:
            '시니어의 디지털 접근성 향상으로 포용적이고 안전한 도시(SDG 11)를 만든다.',
        },
        {
          sdg: 'SDG_17',
          score: 88,
          keywords: ['파트너십', '복지관·도서관', '공동 프로그램'],
          rationale:
            '복지관·도서관과의 다층적 파트너십은 SDG 17의 핵심 메시지에 정확히 부합.',
        },
      ],
      contents: [
        {
          type: 'SNS_POST',
          body: `세종 시니어 412명에게 스마트폰을 가르친 청년 강사들 🌉📱\n\n"손녀 사진을 직접 받을 수 있게 됐어요" — 한 어머님의 말씀에 강사가 같이 웃었습니다.\n\n디지털브릿지는 청년 강사 양성과 시니어 교육을 동시에 합니다. 함께 이어주는 다리가 되겠습니다.`,
          hashtags: ['디지털브릿지', '시니어교육', '청년일자리', '세종', 'SDG8'],
          imagePrompt:
            '경로당에서 청년 강사가 시니어 어르신과 마주 앉아 스마트폰 화면을 같이 보며 웃는 모습',
        },
        {
          type: 'SHORT_VIDEO_SCRIPT',
          body: `[0~3초] 어두운 화면 → "디지털이 무서운가요?"\n[3~8초] 시니어 어르신이 처음 스마트폰을 만지는 표정\n[8~15초] 청년 강사의 차분한 설명과 함께 어르신이 자녀와 영상통화 성공\n[15~22초] 412명 누적 수강생 카운터 애니메이션\n[22~28초] 청년 강사의 인터뷰 — "제 일이 누군가의 일상이 되는 게 좋아요"\n[28~30초] 로고 + "디지털브릿지 · 세대를 잇다"`,
          hashtags: ['숏폼', '디지털브릿지', '세종'],
          editedByUser: true,
        },
      ],
    },
  },
  {
    name: '천안 마을상회 협동조합',
    foundedYear: 2020,
    businessType: 'COOPERATIVE',
    sido: 'CHUNGNAM',
    sigungu: '천안시 동남구',
    industryCategory: 'RETAIL',
    product: '지역 농산물·가공품 큐레이션 상점 + 정기 농부 시장',
    targetAudiences: ['LOCAL_RESIDENT', 'FAMILY'],
    promoGoals: ['SALES_GROWTH', 'LOCAL_AWARENESS'],
    activities: [
      {
        category: 'LOCAL_ECONOMY',
        title: '천안권 17개 농가·공방과 입점 계약',
        description:
          '천안·아산·세종 17개 농가 및 공방의 제철 농산물·수공예품을 정기 입점. 상점 매출의 70%가 입점 농가로 환원.',
      },
      {
        category: 'COMMUNITY',
        title: '월 1회 농부 시장 + 어린이 농산물 체험',
        description:
          '매월 셋째 주 토요일 농부 시장 개최. 같은 날 어린이 30명 대상 농산물 체험·요리 교실 운영.',
      },
    ],
    analysis: {
      publicMeaning:
        '지역 농가 17곳의 판로를 한 곳에 모아 작은 농가도 안정적인 판매처를 확보한 사례. 가족 단위 체험까지 결합해 지역 정체성을 강화.',
      socialFunctions: ['LOCAL_ECONOMY', 'COMMUNITY'],
      matches: [
        {
          sdg: 'SDG_8',
          score: 76,
          keywords: ['지역 경제', '농가 소득', '안정적 판로'],
          rationale:
            '17개 농가·공방에 안정적인 판로를 제공해 소규모 생산자의 양질의 소득(SDG 8) 확보.',
        },
        {
          sdg: 'SDG_11',
          score: 88,
          keywords: ['지역 정체성', '농부 시장', '지속가능한 도시'],
          rationale:
            '월 1회 농부 시장과 어린이 체험은 지역 정체성과 세대 연결을 강화 (SDG 11).',
        },
        {
          sdg: 'SDG_12',
          score: 72,
          keywords: ['로컬푸드', '책임감 있는 소비'],
          rationale: '제철·로컬푸드 유통으로 푸드마일을 줄이는 책임 있는 소비(SDG 12).',
        },
      ],
      contents: [
        {
          type: 'SNS_POST',
          body: `천안 마을상회는 17개 농가의 작은 가게입니다 🥬🌽\n\n매출의 70%는 그대로 농가의 손에 돌아갑니다. 작은 농가도 안정적인 판매처를 가질 수 있도록.\n\n매월 셋째 주 토요일, 농부님들이 직접 나오시는 농부 시장에서 만나요 🧺`,
          hashtags: ['천안', '마을상회', '농부시장', '로컬푸드', 'SDG11'],
          imagePrompt:
            '주말 농부 시장에서 농부와 손님이 토마토를 손에 들고 환하게 대화하는 모습',
        },
        {
          type: 'CARD_NEWS',
          body: `[카드 1] "이 작은 가게 안에 17개 농가가 있어요"\n\n[카드 2] 천안·아산·세종의 17개 농가·공방이 정기 입점합니다.\n\n[카드 3] 매출의 70%가 농가로 환원 — 작은 생산자도 안정적인 판매처.\n\n[카드 4] 매월 셋째 주 토요일 농부 시장 + 어린이 농산물 체험 🌽`,
          hashtags: ['카드뉴스', '천안', '농부시장', '마을상회'],
        },
        {
          type: 'CAMPAIGN_SLOGAN',
          body: '천안의 식탁, 천안의 손에서.',
          hashtags: ['천안마을상회', '캠페인'],
        },
      ],
    },
  },
  {
    name: '공주 공예작가 협동조합',
    foundedYear: 2022,
    businessType: 'COOPERATIVE',
    sido: 'CHUNGNAM',
    sigungu: '공주시',
    industryCategory: 'CULTURE_ARTS',
    product: '도예·금속·섬유 등 11인 공예작가 공동 브랜드 + 체험 클래스',
    targetAudiences: ['ALL', 'FAMILY', 'YOUTH'],
    promoGoals: ['BRAND_AWARENESS', 'PRODUCT_PROMO'],
    activities: [
      {
        category: 'COOPERATION',
        title: '11인 작가 공동 브랜드 운영',
        description:
          '도예·금속·섬유·목공 11인 작가가 한 브랜드 아래 작품을 공동 유통. 개별 작가의 브랜드 마케팅 부담을 줄임.',
      },
      {
        category: 'COMMUNITY',
        title: '주말 공예 체험 클래스',
        description:
          '주말마다 가족 단위 공예 체험 클래스 운영 (2시간 / 인당 25,000원). 누적 참가 320팀.',
      },
      {
        category: 'LOCAL_ECONOMY',
        title: '공주 원도심 빈 점포 활용',
        description:
          '공주 원도심의 빈 점포 2곳을 임대·리모델링해 작업실 + 쇼룸으로 운영. 원도심 활성화 기여.',
      },
    ],
    analysis: {
      publicMeaning:
        '개별 공예작가들이 협력해 브랜드 마케팅 부담을 나눠지고, 원도심 빈 점포 재활용까지 함께 풀어낸 사례. 공예 산업의 작은 단위 협동 모델.',
      socialFunctions: ['COOPERATION', 'COMMUNITY', 'LOCAL_ECONOMY'],
      matches: [
        {
          sdg: 'SDG_17',
          score: 91,
          keywords: ['협동조합', '11인 작가', '공동 브랜드'],
          rationale:
            '11인 작가가 한 브랜드 아래 협동하는 구조는 SDG 17 파트너십의 모범.',
        },
        {
          sdg: 'SDG_11',
          score: 80,
          keywords: ['원도심 활성화', '문화·예술', '지속가능한 도시'],
          rationale:
            '공주 원도심 빈 점포 재활용은 지속가능한 도시(SDG 11) 메시지와 부합.',
        },
        {
          sdg: 'SDG_8',
          score: 72,
          keywords: ['공예작가', '안정적 소득', '소규모 사업자'],
          rationale: '공예작가의 안정적 소득과 일자리 유지(SDG 8).',
        },
      ],
      contents: [
        {
          type: 'SNS_POST',
          body: `공주 원도심의 빈 가게가 11명의 작가의 작업실이 되었습니다 🏺✨\n\n도예, 금속, 섬유, 목공 — 다른 분야의 작가들이 같은 브랜드 아래 함께합니다. 혼자서는 어려운 마케팅과 유통을 함께 풀어가요.\n\n주말, 가족 공예 체험으로 만나러 와주세요. 320팀이 이미 다녀가셨어요 🎨`,
          hashtags: ['공주', '공예작가', '협동조합', '원도심', 'SDG17'],
          imagePrompt:
            '공주 원도심의 리모델링된 작업실에서 도예 작가가 가족 손님에게 물레 시범을 보이는 따뜻한 장면',
        },
        {
          type: 'CAMPAIGN_SLOGAN',
          body: '혼자의 손, 함께의 브랜드.',
          hashtags: ['공주공예', '협동'],
          editedByUser: true,
        },
      ],
    },
  },
]

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const url = databaseUrl.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url })
  const db = new PrismaClient({ adapter })

  try {
    // 1. demo user upsert + 비밀번호 (시연 로그인용)
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS)
    const demo = await db.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { password: passwordHash, name: DEMO_NAME },
      create: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        password: passwordHash,
        emailVerified: new Date(),
      },
    })
    console.log(`✓ demo user 준비: ${demo.email} (id=${demo.id})`)

    // 2. 익명 Company → demo 계정 귀속
    const orphan = await db.company.updateMany({
      where: { userId: null },
      data: { userId: demo.id },
    })
    if (orphan.count > 0) {
      console.log(`✓ 익명 Company ${orphan.count}건을 demo 계정에 귀속`)
    }

    // 3. demo 계정의 기존 시드 기업 삭제 (cascade로 활동·분석·콘텐츠 함께 삭제)
    const deleted = await db.company.deleteMany({
      where: {
        userId: demo.id,
        name: { in: COMPANIES.map((c) => c.name) },
      },
    })
    if (deleted.count > 0) {
      console.log(`✓ 기존 시드 기업 ${deleted.count}건 삭제 후 재생성`)
    }

    // 4. 시드 데이터 생성
    for (const c of COMPANIES) {
      const company = await db.company.create({
        data: {
          userId: demo.id,
          name: c.name,
          foundedYear: c.foundedYear,
          businessType: c.businessType,
          sido: c.sido,
          sigungu: c.sigungu,
          industryCategory: c.industryCategory,
          product: c.product,
          targetAudiences: JSON.stringify(c.targetAudiences),
          promoGoals: JSON.stringify(c.promoGoals),
          activities: {
            create: c.activities,
          },
        },
      })

      const analysis = await db.sdgAnalysis.create({
        data: {
          companyId: company.id,
          publicMeaning: c.analysis.publicMeaning,
          socialFunctions: JSON.stringify(c.analysis.socialFunctions),
          usedFallback: false,
          matches: {
            create: c.analysis.matches.map((m) => ({
              sdg: m.sdg,
              score: m.score,
              keywords: JSON.stringify(m.keywords),
              rationale: m.rationale,
            })),
          },
          contents: {
            create: c.analysis.contents.map((ct) => ({
              type: ct.type,
              body: ct.body,
              hashtags: JSON.stringify(ct.hashtags),
              imagePrompt: ct.imagePrompt ?? null,
              editedByUser: ct.editedByUser ?? false,
              usedFallback: false,
            })),
          },
        },
      })

      console.log(
        `  • ${c.name} — 활동 ${c.activities.length} · SDG ${c.analysis.matches.length} · 콘텐츠 ${c.analysis.contents.length} (분석 ${analysis.id})`,
      )
    }

    console.log(`\n✅ 시연용 시드 완료`)
    console.log(`   이메일:   ${DEMO_EMAIL}`)
    console.log(`   비밀번호: ${DEMO_PASSWORD}`)
    console.log(`   기업:     ${COMPANIES.length}건`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error('[seed] failed:', e)
  process.exitCode = 1
})
