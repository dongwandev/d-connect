# ARCHITECTURE — 아키텍처 개요

> 본 문서는 현재 채택된 구조의 **"무엇"**을 설명한다.
> 그 결정의 **"왜"**는 [ADR-0003](adr/0003-architecture.md)을 참고한다.

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [폴더 구조](#2-폴더-구조)
3. [레이어 구조](#3-레이어-구조)
4. [데이터 흐름](#4-데이터-흐름)
5. [AI 통합 구조](#5-ai-통합-구조)
6. [에러 처리](#6-에러-처리)
7. [환경 변수](#7-환경-변수)
8. [Server / Client Component 경계](#8-server--client-component-경계)
9. [외부 의존성](#9-외부-의존성)
10. [배포 구성](#10-배포-구성)

---

## 1. 시스템 개요

D-Connect는 **풀스택 단일 Next.js 16 (App Router) 애플리케이션**이다.

- 프론트엔드와 백엔드(Route Handler)를 같은 코드베이스에서 운영
- 브라우저 ↔ Next.js Server ↔ {SQLite, Anthropic API} 의 3개 노드
- 인증·외부 데이터 연동 없음 (MVP 범위)

```
┌───────────────┐        ┌──────────────────────────┐        ┌─────────────────────┐
│   Browser     │  HTTPS │ Next.js (Server + Client) │  Net   │ Anthropic Claude API│
│ (Server Comp  │ ─────▶ │ ┌────────────────────────┐│ ─────▶ └─────────────────────┘
│  + Client     │        │ │ App Router             ││
│  Comp 혼합)   │ ◀───── │ │ ┌──────────────────┐  ││        ┌─────────────────────┐
│               │  HTML  │ │ │ Page (RSC)       │  ││  file  │ SQLite (dev.db)     │
└───────────────┘        │ │ │ Route Handler    │  │├──────▶ └─────────────────────┘
                         │ │ └──────────────────┘  ││
                         │ └────────────────────────┘│
                         │   server/ (db, env, ai)   │
                         └──────────────────────────┘
```

---

## 2. 폴더 구조

**기능 분리** 방식 채택.

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # Route Handler (REST 엔드포인트)
│   │   └── .../route.ts
│   ├── (pages)/          # 사용자 페이지
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── server/               # 서버 전용 (절대 client에서 import 금지)
│   ├── db.ts             # Prisma Client 싱글톤
│   ├── env.ts            # 환경 변수 + zod 검증
│   ├── errors.ts         # ApiError + Route Handler wrapper
│   └── ai/               # AI 통합
│       ├── client.ts     # Anthropic SDK 인스턴스
│       ├── schemas.ts    # zod 응답 스키마
│       ├── prompts/      # 시스템 프롬프트 모음
│       ├── mock/         # mock fallback 응답
│       └── index.ts      # public API (analyzeSdg, generateContent)
│
├── lib/                  # 순수 유틸 (server/client 양쪽 사용 가능, 부수효과 X)
│
├── components/           # React 컴포넌트
│   └── ui/               # 기본 UI 요소
│
└── generated/            # 자동 생성 (gitignored)
    └── prisma/           # Prisma Client
```

### 규칙

- `src/server/**`는 **client component에서 import 금지** — Next.js의 `'server-only'` 패키지로 강제하는 것 권장.
- `src/lib/**`는 부수효과 없는 순수 함수만 (Date 포맷, 문자열 처리 등).
- 페이지 라우트는 `src/app/(pages)/...` 그룹으로 묶어 `app/api/`와 시각적으로 분리.

---

## 3. 레이어 구조

**3-layer** — Page → Route Handler → DB/AI 직접 호출.

```
┌────────────────────────────┐
│  Page (Server Component)   │  ← 직접 db.* 호출 또는 fetch '/api/...'
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  Route Handler (route.ts)  │  ← zod 검증 → db/ai 호출 → JSON 응답
└────┬──────────────────┬────┘
     │                  │
     ▼                  ▼
┌──────────┐    ┌─────────────────┐
│ Prisma   │    │ AI Module       │
│ (db.ts)  │    │ (server/ai/...) │
└──────────┘    └─────────────────┘
```

- **Service / Repository 계층 없음** — MVP 규모(엔티티 6종)에 비해 과한 보일러플레이트.
- 도메인이 커지거나 같은 비즈니스 로직이 여러 Route에서 반복되면 그때 Service 도입 고려.

---

## 4. 데이터 흐름

### 4.1 데이터 조회 (예: 기업 목록)

```
Page (RSC)
  └─▶ db.company.findMany()   ← 직접 호출 (별도 fetch 불필요)
        └─▶ SQLite
```

### 4.2 데이터 생성 (예: 기업 + 활동 입력)

```
Client Component (폼)
  └─▶ fetch POST /api/companies (JSON body)
        └─▶ Route Handler
              ├─▶ zod 검증 (실패 → 400)
              └─▶ db.company.create(...)
                    └─▶ SQLite
                  반환: { data: { id, ... } }
```

### 4.3 AI 호출 (예: SDGs 분석)

```
Client Component
  └─▶ fetch POST /api/companies/[id]/sdg-analysis
        └─▶ Route Handler (30초 타임아웃)
              ├─▶ zod 검증
              ├─▶ db로 Company + Activity 조회
              ├─▶ ai.analyzeSdg(company, activities)
              │     ├─ ANTHROPIC_API_KEY 있음 → Claude 호출 → zod 검증
              │     └─ 없음 / 실패 / 타임아웃 → mock 응답 (동일 스키마)
              ├─▶ db.sdgAnalysis.create(...)
              └─▶ JSON 응답: { data: { ... } }
```

---

## 5. AI 통합 구조

**책임별 분리** 모듈 배치.

```
src/server/ai/
├── client.ts             # const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
├── schemas.ts            # SdgAnalysisResultSchema, GeneratedContentSchema (zod)
├── prompts/
│   ├── sdg-analysis.ts   # buildSdgAnalysisPrompt(company, activities)
│   └── content-generation.ts
├── mock/
│   ├── sdg-analysis.ts   # mockSdgAnalysis(company)
│   └── content-generation.ts
└── index.ts              # export async function analyzeSdg(...) / generateContent(...)
```

### 호출 규약

```ts
// 단일 진입점 — 호출자는 mock인지 실제인지 알 필요 없음
import { analyzeSdg, generateContent } from '@/server/ai'

const result = await analyzeSdg(company, activities)
// result: 항상 SdgAnalysisResult 스키마 (mock 여부와 무관)
```

### Fallback 정책

| 조건 | 동작 |
|------|------|
| `ANTHROPIC_API_KEY` 비어 있음 | mock 응답 반환 (log: `[ai] mock — no API key`) |
| Anthropic API 호출 실패 | mock 응답 반환 (log: `[ai] mock — API error: ...`) |
| 30초 타임아웃 초과 | mock 응답 반환 (log: `[ai] mock — timeout`) |
| 응답이 zod 스키마 검증 실패 | mock 응답 반환 (log: `[ai] mock — schema validation failed`) |

응답 envelope에는 `{ error: { code: 'AI_FAILED_FALLBACK_USED', ... } }`를 함께 실어 클라이언트가 사용자에게 안내할 수 있게 한다(요청은 성공으로 처리).

---

## 6. 에러 처리

**throw + Route Handler catch + JSON envelope** 패턴.

```ts
// src/server/errors.ts
export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message)
  }
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>
): Promise<NextResponse> {
  try {
    const data = await fn()
    return NextResponse.json({ data })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status }
      )
    }
    console.error('[unhandled]', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

### 표준 에러 코드 (1차)

| code                       | status | 의미                                         |
|----------------------------|--------|----------------------------------------------|
| `VALIDATION_ERROR`         | 400    | zod 검증 실패                                |
| `NOT_FOUND`                | 404    | 리소스 없음                                  |
| `AI_FAILED_FALLBACK_USED`  | 200    | AI 호출 실패해 mock 사용 (envelope에 동봉) |
| `INTERNAL_ERROR`           | 500    | 처리되지 않은 예외                          |

---

## 7. 환경 변수

**zod 검증 + `env` 객체 export**.

```ts
// src/server/env.ts
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL_DEFAULT: z.string().default('claude-sonnet-4-7-latest'),
  LLM_MODEL_FAST: z.string().default('claude-haiku-4-7-latest'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = schema.parse(process.env)
```

### 사용

```ts
import { env } from '@/server/env'

if (!env.ANTHROPIC_API_KEY) {
  // mock 폴백 경로
}
```

누락 시 startup에서 즉시 실패 — production 배포 전 검출.

---

## 8. Server / Client Component 경계

| 위치                      | 종류                         | 이유                                      |
|---------------------------|------------------------------|-------------------------------------------|
| 페이지 진입 (`page.tsx`)  | **Server Component** (기본)  | DB·AI 접근 가능, 초기 로드 빠름           |
| 데이터 조회               | Server                       | Prisma는 server only                      |
| 폼 입력 / 인터랙션        | **Client Component** (`'use client'`) | `useState`, 이벤트 핸들러          |
| AI 호출                   | Server (Route Handler)       | API 키 노출 금지                          |
| 생성된 초안 편집 화면     | Client                       | textarea + 저장 버튼                      |

### 원칙

> **"기본은 server, 인터랙션 필요한 leaf만 client"**

- Client component 내부에서 server 데이터를 받아야 하면 **props로 전달**.
- DB/AI 호출 코드를 client에서 import하지 않도록 `'server-only'` 패키지로 강제.
- 폼 제출은 Route Handler(`/api/...`)로 fetch — Server Action은 MVP에서 미사용 (단순화).

---

## 9. 외부 의존성

| 종류        | 항목                | 비고                                              |
|-------------|---------------------|---------------------------------------------------|
| LLM API     | Anthropic Claude    | Sonnet 4.7 기본 / Haiku 4.7 보조 ([ADR-0002](adr/0002-llm-provider.md)) |
| DB          | SQLite (파일 기반)  | `prisma/dev.db`, 시연 환경 동봉 가능              |
| 패키지 호스트 | npm registry       | pnpm 11.3 (`packageManager` 필드 고정)            |

외부 인증 / OAuth / 결제 / 분석 SDK 없음.

---

## 10. 배포 구성

**현재 단계: 로컬 시연 우선.**

- 시연 환경: 로컬 `pnpm dev` 또는 `pnpm build && pnpm start`
- 백업: 시연 영상 사전 녹화 (안건에 따라 결정)
- 후속: Vercel / 자체 호스팅 선택 — [ADR-0001 추후 결정](adr/0001-tech-stack.md#추후-결정-후속-adr-후보)

CD(자동 배포)는 발표 시연 이후 운영 단계 진입 시 결정.

---

## 변경 이력

- 2026-05-27: 초안 작성. 회의 결정 10개 항목 반영.
