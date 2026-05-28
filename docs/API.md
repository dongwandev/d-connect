# API 명세

> 본 문서는 **REST API 계약**을 정의한다.
> 구현은 `src/app/api/.../route.ts`에 있으며, 이 문서와 정합을 유지한다.

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [엔드포인트 목록](#2-엔드포인트-목록)
3. [Companies](#3-companies)
4. [SDGs Analysis](#4-sdgs-analysis)
5. [Contents](#5-contents)
6. [AI 호출 엔드포인트 동작](#6-ai-호출-엔드포인트-동작)
7. [스키마 콜로케이션](#7-스키마-콜로케이션-컨벤션)

---

## 1. 공통 사항

### 1.1 Base URL

- 개발: `http://localhost:3000`
- 모든 엔드포인트는 `/api` 접두를 가진다.

### 1.2 응답 envelope

**성공:**

```json
{ "data": { ... } }
```

**실패:**

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { ... } } }
```

| 필드          | 타입   | 비고                                              |
|---------------|--------|---------------------------------------------------|
| `data`        | any    | 성공 시 응답 본문                                 |
| `error.code`  | string | [표준 에러 코드](#13-에러-코드)                   |
| `error.message` | string | 사용자에게 노출 가능한 메시지                  |
| `error.details` | any?   | 디버그·검증 상세 (선택, zod issues 등)          |

> **참고:** AI mock fallback이 발동해도 클라이언트는 알지 못한다(사용자 결정 #5). 운영 모니터링용으로 DB의 `usedFallback` 플래그만 사용. → [§6 AI 호출 엔드포인트 동작](#6-ai-호출-엔드포인트-동작) 참고.

### 1.3 에러 코드

| code                       | HTTP | 의미                                          |
|----------------------------|------|-----------------------------------------------|
| `VALIDATION_ERROR`         | 400  | zod 검증 실패. `details`에 issue 배열 포함    |
| `NOT_FOUND`                | 404  | 리소스 없음                                   |
| `AI_FAILED_FALLBACK_USED`  | —    | (내부 전용) 클라이언트에 노출 안 함            |
| `INTERNAL_ERROR`           | 500  | 처리되지 않은 예외                            |

> `AI_FAILED_FALLBACK_USED`는 [`src/server/errors.ts`](../src/server/errors.ts)에 정의되어 있지만, 사용자 결정 #5에 따라 **클라이언트에 노출하지 않는다**. 추후 운영 단계 모니터링용으로만 사용.

### 1.4 인증

MVP 범위에서 **인증 없음** ([PRD §6](PRD.md#6-범위-외-out-of-scope)).

### 1.5 Validation

- 모든 요청은 Route Handler 진입 시 **zod로 검증** ([ARCHITECTURE §3](ARCHITECTURE.md#3-레이어-구조)).
- 실패 시 `400 VALIDATION_ERROR` + `details: ZodIssue[]` 반환.

### 1.6 ID 형식

- 모든 리소스 ID는 **`cuid`** (예: `clxyz123abc...`).
- URL-safe이며 그대로 path parameter에 사용한다.

### 1.7 시간 형식

- 모든 datetime은 ISO 8601 (예: `"2026-05-27T09:30:00.000Z"`).

### 1.8 페이지네이션

MVP에서는 적용하지 않는다. 모든 목록 응답은 `createdAt DESC`로 정렬된다.

---

## 2. 엔드포인트 목록

| # | Method | Path | 설명 | AI 호출 |
|---|--------|------|------|---------|
| 1 | POST   | `/api/companies` | 기업 + 활동 생성 (atomic) | — |
| 2 | GET    | `/api/companies` | 기업 목록 | — |
| 3 | GET    | `/api/companies/{id}` | 기업 상세 (활동 + 최신 분석 포함) | — |
| 4 | POST   | `/api/companies/{id}/sdg-analysis` | SDGs 분석 요청 | ✅ |
| 5 | GET    | `/api/companies/{id}/sdg-analysis` | 분석 이력 목록 | — |
| 6 | GET    | `/api/sdg-analysis/{id}` | 분석 상세 (매칭 + 콘텐츠 포함) | — |
| 7 | POST   | `/api/sdg-analysis/{id}/content` | 콘텐츠 초안 생성 | ✅ |
| 8 | GET    | `/api/sdg-analysis/{id}/contents` | 콘텐츠 목록 | — |
| 9 | PATCH  | `/api/contents/{id}` | 콘텐츠 초안 수정 | — |

---

## 3. Companies

### 3.1 POST `/api/companies` — 기업 + 활동 생성 (atomic)

기업 정보와 1개 이상의 활동을 **한 번의 요청·트랜잭션으로** 생성한다.

**Request body:**

```json
{
  "name": "동네 친환경 카페",
  "industry": "카페·음료",
  "region": "대전",
  "product": "원두 직배전 커피",
  "purpose": "지역상생 캠페인 자료에 활용",
  "activities": [
    {
      "category": "ENVIRONMENT",
      "title": "다회용 컵 캠페인",
      "description": "지난주부터 다회용 컵 사용 시 500원 할인 캠페인 시작."
    }
  ]
}
```

**zod 스키마:**

```ts
const CreateCompanySchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().max(50).optional(),
  region: z.string().max(50).optional(),
  product: z.string().max(200).optional(),
  purpose: z.string().max(500).optional(),
  activities: z.array(z.object({
    category: z.nativeEnum(SocialCategory),
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
  })).min(1),
})
```

**Response 201:**

```json
{
  "data": {
    "id": "clxyz...",
    "name": "동네 친환경 카페",
    "industry": "카페·음료",
    "region": "대전",
    "product": "원두 직배전 커피",
    "purpose": "지역상생 캠페인 자료에 활용",
    "activities": [
      {
        "id": "clxyz_act_1",
        "category": "ENVIRONMENT",
        "title": "다회용 컵 캠페인",
        "description": "...",
        "createdAt": "2026-05-27T09:30:00.000Z"
      }
    ],
    "createdAt": "2026-05-27T09:30:00.000Z",
    "updatedAt": "2026-05-27T09:30:00.000Z"
  }
}
```

**가능한 에러:**

- `400 VALIDATION_ERROR` — `activities` 비어 있음 / 필드 길이 초과 등

---

### 3.2 GET `/api/companies` — 기업 목록

**Query parameters:** 없음 (MVP).

**Response 200:**

```json
{
  "data": [
    {
      "id": "clxyz...",
      "name": "동네 친환경 카페",
      "industry": "카페·음료",
      "region": "대전",
      "createdAt": "2026-05-27T09:30:00.000Z",
      "updatedAt": "2026-05-27T09:30:00.000Z"
    }
  ]
}
```

**참고:** 목록 응답에는 활동·분석을 포함하지 않는다 (페이지 로드 가벼움). 상세 보기는 [§3.3](#33-get-apicompaniesid--기업-상세).

---

### 3.3 GET `/api/companies/{id}` — 기업 상세

기업 + 활동 전체 + **최신 분석 1개**(없으면 `null`)를 포함한다.

**Response 200:**

```json
{
  "data": {
    "id": "clxyz...",
    "name": "동네 친환경 카페",
    "industry": "카페·음료",
    "region": "대전",
    "product": "원두 직배전 커피",
    "purpose": "지역상생 캠페인 자료에 활용",
    "activities": [ /* Activity[] */ ],
    "latestAnalysis": {
      "id": "clxyz_an_1",
      "createdAt": "2026-05-27T09:31:00.000Z"
      // matches/contents는 별도 호출
    },
    "createdAt": "2026-05-27T09:30:00.000Z",
    "updatedAt": "2026-05-27T09:30:00.000Z"
  }
}
```

`latestAnalysis`는 요약만 (id + createdAt). 상세는 [§4.3](#43-get-apisdg-analysisid--분석-상세).

**에러:** `404 NOT_FOUND`

---

## 4. SDGs Analysis

### 4.1 POST `/api/companies/{id}/sdg-analysis` — SDGs 분석 요청 (AI)

기업의 활동을 LLM으로 분석해 SDGs 추천 + 사회적 의미를 생성·저장한다.

**Request body:** 비어 있음 (`{}` 또는 본문 없음). 활동·기업 정보는 DB에서 조회.

**Response 201:**

```json
{
  "data": {
    "id": "clxyz_an_1",
    "companyId": "clxyz...",
    "socialFunctions": ["ENVIRONMENT", "COMMUNITY"],
    "publicMeaning": "지역 소상공인이 시민 인식 변화를 유도하는 환경 캠페인 사례로 ...",
    "matches": [
      {
        "id": "clxyz_m_1",
        "sdg": "SDG_12",
        "score": 85,
        "keywords": ["일회용품 저감", "다회용 컵"],
        "rationale": "입력된 활동이 ..."
      },
      {
        "id": "clxyz_m_2",
        "sdg": "SDG_11",
        "score": 72,
        "keywords": ["지역 공동체", "동네 행사"],
        "rationale": "..."
      }
    ],
    "createdAt": "2026-05-27T09:31:00.000Z",
    "updatedAt": "2026-05-27T09:31:00.000Z"
  }
}
```

**참고:**

- `socialFunctions`는 JSON-string 컬럼이지만 응답에는 **파싱된 enum 배열로** 반환한다.
- `matches[].keywords`도 동일.
- AI 호출이 mock으로 폴백되어도 응답 구조는 동일하다 — [§6](#6-ai-호출-엔드포인트-동작).

**가능한 에러:**

- `404 NOT_FOUND` — 기업 ID 없음
- `400 VALIDATION_ERROR` — 활동이 하나도 없는 기업 (입력 검증 실패)

---

### 4.2 GET `/api/companies/{id}/sdg-analysis` — 분석 이력 목록

**Response 200:**

```json
{
  "data": [
    {
      "id": "clxyz_an_2",
      "createdAt": "2026-05-27T10:00:00.000Z"
    },
    {
      "id": "clxyz_an_1",
      "createdAt": "2026-05-27T09:31:00.000Z"
    }
  ]
}
```

**참고:** 분석 매칭·콘텐츠는 포함하지 않는다. 상세 페이지에서 별도 호출.

---

### 4.3 GET `/api/sdg-analysis/{id}` — 분석 상세

분석 1개 + 매칭 전체 + 콘텐츠 목록 요약을 포함한다.

**Response 200:**

```json
{
  "data": {
    "id": "clxyz_an_1",
    "companyId": "clxyz...",
    "socialFunctions": ["ENVIRONMENT", "COMMUNITY"],
    "publicMeaning": "...",
    "matches": [ /* SdgMatch[] */ ],
    "contents": [
      {
        "id": "clxyz_ct_1",
        "type": "SNS_POST",
        "createdAt": "2026-05-27T09:32:00.000Z"
      }
    ],
    "createdAt": "2026-05-27T09:31:00.000Z",
    "updatedAt": "2026-05-27T09:31:00.000Z"
  }
}
```

`contents[]`는 요약만 (id + type + createdAt). 본문 조회는 [§5.1](#51-get-apisdg-analysisidcontents--콘텐츠-목록) 또는 콘텐츠 상세 (필요시 추가).

**에러:** `404 NOT_FOUND`

---

## 5. Contents

### 5.1 GET `/api/sdg-analysis/{id}/contents` — 콘텐츠 목록

분석에 속한 모든 콘텐츠 (본문 포함).

**Response 200:**

```json
{
  "data": [
    {
      "id": "clxyz_ct_1",
      "type": "SNS_POST",
      "body": "저희 가게는 ...",
      "hashtags": ["#지역상생", "#환경캠페인", "#일회용품저감"],
      "imagePrompt": "카페 카운터 위에 ...",
      "editedByUser": false,
      "createdAt": "2026-05-27T09:32:00.000Z",
      "updatedAt": "2026-05-27T09:32:00.000Z"
    }
  ]
}
```

**참고:** `hashtags`는 JSON-string 컬럼이지만 응답에는 **파싱된 string 배열**.

---

### 5.2 POST `/api/sdg-analysis/{id}/content` — 콘텐츠 생성 (AI)

지정한 유형으로 콘텐츠 초안을 생성·저장한다.

**Request body:**

```json
{ "type": "SNS_POST" }
```

**zod 스키마:**

```ts
const CreateContentSchema = z.object({
  type: z.nativeEnum(ContentType),
})
```

> **참고:** 사용자 톤 힌트(`toneHint`)는 MVP 범위 외 — 결정 #7. 시스템 프롬프트가 톤을 결정한다.

**Response 201:** [§5.1](#51-get-apisdg-analysisidcontents--콘텐츠-목록)의 단일 객체와 동일 구조.

**에러:**

- `404 NOT_FOUND` — 분석 ID 없음
- `400 VALIDATION_ERROR` — 유효하지 않은 `type`

---

### 5.3 PATCH `/api/contents/{id}` — 초안 수정

사용자가 직접 편집한 결과를 저장한다. 저장 시 `editedByUser`가 `true`로 설정된다.

**Request body (모두 optional):**

```json
{
  "body": "수정된 본문",
  "hashtags": ["#수정", "#태그"],
  "imagePrompt": "수정된 프롬프트"
}
```

**zod 스키마:**

```ts
const UpdateContentSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  hashtags: z.array(z.string().max(50)).max(20).optional(),
  imagePrompt: z.string().max(500).nullable().optional(),
}).refine(
  (v) => v.body !== undefined || v.hashtags !== undefined || v.imagePrompt !== undefined,
  { message: '하나 이상의 필드가 필요합니다.' },
)
```

**Response 200:** 수정된 콘텐츠 객체.

**에러:**

- `404 NOT_FOUND`
- `400 VALIDATION_ERROR`

---

## 6. AI 호출 엔드포인트 동작

`/api/companies/{id}/sdg-analysis` (POST), `/api/sdg-analysis/{id}/content` (POST)에 공통 적용.

### 동작 순서

```
Route Handler 진입
  └─▶ zod 검증 (실패 시 400)
        └─▶ DB에서 필요한 데이터 조회 (실패 시 404)
              └─▶ src/server/ai의 단일 진입점 호출
                    │
                    ├─ ANTHROPIC_API_KEY 있음 + 정상 → Anthropic 응답 + zod 검증 통과
                    └─ 키 부재 / 호출 실패 / 30초 타임아웃 / 스키마 실패
                       → mock 응답 반환 (동일 스키마)
              ├─▶ DB에 결과 저장 (usedFallback 플래그 동봉)
              └─▶ Response 반환 (usedFallback은 응답에 포함 X)
```

### usedFallback 노출 정책 — 비노출

**사용자 결정 #5:** `usedFallback`은 DB에는 저장하되 **클라이언트 응답에는 포함하지 않는다.**

| 위치 | usedFallback 포함 여부 |
|------|------------------------|
| DB (`SdgAnalysis.usedFallback`, `GeneratedContent.usedFallback`) | ✅ 저장 |
| API 응답 envelope | ❌ 노출 X |
| 운영 모니터링 (DB 직접 조회) | ✅ 사용 |

이유: 시연 안정성 — mock 응답도 동일 품질의 결과로 사용자에게 보여 흐름을 끊지 않음.

### 타임아웃

- AI 호출당 **30초** ([ARCHITECTURE §5](ARCHITECTURE.md#5-ai-통합-구조)).
- 초과 시 mock fallback.

### 에러

AI 호출이 실패해도 사용자 응답은 **성공(2xx)** 으로 처리된다 (mock으로 폴백). DB의 `usedFallback`만 `true`로 남는다.

단, DB 조회/저장 단계 실패는 일반 에러(`500 INTERNAL_ERROR`)로 처리.

---

## 7. 스키마 콜로케이션 컨벤션

zod 스키마는 **Route 파일 옆에 동거**한다 — 결정 #8.

```
src/app/api/
├── companies/
│   ├── route.ts                            # POST / GET
│   ├── schemas.ts                          # CreateCompanySchema
│   └── [id]/
│       ├── route.ts                        # GET
│       └── sdg-analysis/
│           └── route.ts                    # POST / GET
├── sdg-analysis/
│   └── [id]/
│       ├── route.ts                        # GET
│       └── content/
│           ├── route.ts                    # POST
│           └── schemas.ts                  # CreateContentSchema
└── contents/
    └── [id]/
        ├── route.ts                        # PATCH
        └── schemas.ts                      # UpdateContentSchema
```

- AI 응답 검증용 zod는 `src/server/ai/schemas.ts`에 별도 위치 ([ARCHITECTURE §5](ARCHITECTURE.md#5-ai-통합-구조)).
- 응답 직렬화 헬퍼(JSON-string ↔ 배열)는 후속 PR에서 `src/lib/json-array.ts`로 추가 예정.

---

## 변경 이력

- 2026-05-27: 초안 작성. 사용자 결정 8개 항목 반영 (usedFallback 비노출 포함).
