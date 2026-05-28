# DB 스키마

> 본 문서는 **데이터 모델의 설계 의도**를 설명한다.
> 실제 정의는 [`prisma/schema.prisma`](../prisma/schema.prisma)에 있으며, 변경 시 두 문서를 함께 갱신한다.

---

## 1. 개요

- **DB**: SQLite (파일 기반, `prisma/dev.db`) — [ADR-0001](adr/0001-tech-stack.md)
- **ORM**: Prisma 7 (`prisma-client` generator, `src/generated/prisma/`)
- **엔티티 수**: 5종 도메인 + 4종 인증(Auth.js 표준)
- **관계 구조**: 모두 1:N. M:N 없음. (MVP 단순화)
- **인증·권한**: NextAuth.js v5 + Prisma adapter — [ADR-0004](adr/0004-auth.md), [ADR-0005](adr/0005-multitenancy.md)
- **멀티테넌시**: `Company.userId`로 회원당 본인 기업 모델 — ADR-0005

---

## 2. ERD 개요

```
┌───────────┐ 1     N ┌──────────┐
│  Company  │ ──────▶ │ Activity │
└─────┬─────┘         └──────────┘
      │ 1
      │
      ▼ N
┌─────────────────┐ 1    N ┌──────────┐
│  SdgAnalysis    │ ─────▶ │ SdgMatch │
│  (분석 1회 = 1) │        └──────────┘
└──────┬──────────┘
       │ 1
       ▼ N
┌──────────────────┐
│ GeneratedContent │
└──────────────────┘
```

**관계 요약:**

| 부모              | 자식              | 관계 | 의미                                          |
|-------------------|-------------------|------|-----------------------------------------------|
| Company           | Activity          | 1:N  | 기업 하나가 여러 활동을 가짐                  |
| Company           | SdgAnalysis       | 1:N  | 기업 하나가 여러 분석 이력을 가짐 (시점별)    |
| SdgAnalysis       | SdgMatch          | 1:N  | 분석 1회가 여러 SDG 매칭을 가짐               |
| SdgAnalysis       | GeneratedContent  | 1:N  | 분석 1회 기반으로 여러 콘텐츠 초안 생성       |

---

## 3. 엔티티 정의

### 3.0 인증 모델 (Auth.js v5 표준)

NextAuth Prisma adapter가 요구하는 4개 모델. 본 문서는 도메인 모델 중심이라 인증
모델은 표준 형태 그대로이며 상세는 [Auth.js 공식 문서](https://authjs.dev/getting-started/adapters/prisma)와 [ADR-0004](adr/0004-auth.md)를 참고한다.

| 모델 | 역할 |
|------|------|
| `User` | 회원. `email`(unique) / `name` / `image` / `emailVerified` / **`password` (bcrypt 해시, optional — OAuth/dev 회원은 NULL)** |
| `Account` | OAuth provider별 외부 식별자 + 토큰 (사용자 1:N) |
| `Session` | NextAuth 표준 모델. 현재 JWT session 사용 중이라 미사용 — 향후 DB session 복원 시 활용 |
| `VerificationToken` | NextAuth 표준 모델. 현재 미사용 (Magic Link 제외) |

User → Company는 1:N. 자식 리소스(Activity / SdgAnalysis / SdgMatch / GeneratedContent)는 Company를 통해 간접 소유 (ADR-0005).


### 3.1 `Company` — 기업 기본 정보

| 필드        | 타입       | 제약               | 설명                                                |
|-------------|------------|--------------------|-----------------------------------------------------|
| `id`        | String     | PK, `cuid()`       | URL-safe 고유 ID                                    |
| `userId`    | String?    | FK → User.id, cascade | 소유 사용자 (멀티테넌시 - ADR-0005). 일시 optional, application 레이어에서 항상 채움 |
| `name`      | String     | required           | 기업명                                              |
| `industry`  | String?    | optional           | 업종 (자유 텍스트)                                  |
| `region`    | String?    | optional           | 소재 지역 (대전 / 세종 / 충남 등)                   |
| `product`   | String?    | optional           | 제품·서비스 (자유 텍스트)                           |
| `purpose`   | String?    | optional           | 홍보 목적                                           |
| `createdAt` | DateTime   | `@default(now())`  |                                                     |
| `updatedAt` | DateTime   | `@updatedAt`       |                                                     |

**관계:** `user User?`, `activities Activity[]`, `analyses SdgAnalysis[]`
**인덱스:** `userId` (소유자별 조회 빈번)

---

### 3.2 `Activity` — 지역사회 기여 활동

| 필드          | 타입            | 제약                          | 설명                                     |
|---------------|-----------------|-------------------------------|------------------------------------------|
| `id`          | String          | PK, `cuid()`                  |                                          |
| `companyId`   | String          | FK → Company.id, **cascade delete** | 부모 기업 삭제 시 활동도 삭제      |
| `category`    | `SocialCategory`| required (enum)               | 고용·환경·지역경제·공동체·협력         |
| `title`       | String          | required                      | 짧은 제목                                |
| `description` | String          | required                      | 자유 텍스트 설명                          |
| `createdAt`   | DateTime        | `@default(now())`             |                                          |
| `updatedAt`   | DateTime        | `@updatedAt`                  |                                          |

**관계:** `company Company` (`@relation(fields: [companyId], references: [id], onDelete: Cascade)`)

**인덱스:** `companyId` (외래키 조회 빈번)

---

### 3.3 `SdgAnalysis` — SDGs 분석 결과 1세트

분석은 시점별로 여러 번 가능. 재실행하면 새 row.

| 필드              | 타입                | 제약                          | 설명                                     |
|-------------------|---------------------|-------------------------------|------------------------------------------|
| `id`              | String              | PK, `cuid()`                  |                                          |
| `companyId`       | String              | FK → Company.id, cascade      |                                          |
| `socialFunctions` | `SocialCategory[]`  | required (enum 배열)          | 도출된 사회적 기능 (1~5개)               |
| `publicMeaning`   | String              | required                      | 공공기관·지자체 활용 의미 요약           |
| `usedFallback`    | Boolean             | `@default(false)`             | mock fallback 발동 여부 (운영 모니터링) |
| `createdAt`       | DateTime            | `@default(now())`             |                                          |
| `updatedAt`       | DateTime            | `@updatedAt`                  |                                          |

> **SQLite + Prisma의 enum 배열**: SQLite는 enum 배열을 직접 지원하지 않으므로, Prisma 레벨에서 JSON 또는 콤마 구분 string으로 직렬화한다. `String` 컬럼 + 코드에서 `SocialCategory[]`로 파싱하는 방식이 가장 호환성 높음 — **실 구현 시 `socialFunctions: String`** (JSON.stringify된 array)로 저장하고 application 레이어에서 직렬화/역직렬화.

**관계:** `company Company`, `matches SdgMatch[]`, `contents GeneratedContent[]`

**인덱스:** `companyId`, `createdAt`

---

### 3.4 `SdgMatch` — 분석 안의 개별 SDG 매칭

| 필드           | 타입       | 제약                          | 설명                                     |
|----------------|------------|-------------------------------|------------------------------------------|
| `id`           | String     | PK, `cuid()`                  |                                          |
| `analysisId`   | String     | FK → SdgAnalysis.id, cascade  |                                          |
| `sdg`          | `SdgGoal`  | required (enum)               | `SDG_8` / `SDG_11` / `SDG_12` / `SDG_17` |
| `score`        | Int        | required, `0..100`            | 추천 점수 (애플리케이션에서 검증)        |
| `keywords`     | String     | required                      | 매칭 키워드 (JSON array string)          |
| `rationale`    | String     | required                      | 연결 근거 (자연어)                       |
| `createdAt`    | DateTime   | `@default(now())`             |                                          |

**관계:** `analysis SdgAnalysis`

**인덱스:** `analysisId`

> **유니크 제약:** 한 분석 안에서 같은 SDG가 중복되지 않도록 `@@unique([analysisId, sdg])`.

---

### 3.5 `GeneratedContent` — 생성된 콘텐츠 초안

| 필드          | 타입           | 제약                          | 설명                                     |
|---------------|----------------|-------------------------------|------------------------------------------|
| `id`          | String         | PK, `cuid()`                  |                                          |
| `analysisId`  | String         | FK → SdgAnalysis.id, cascade  |                                          |
| `type`        | `ContentType`  | required (enum)               | SNS / 카드뉴스 / 숏폼 / 슬로건          |
| `body`        | String         | required                      | 본문                                     |
| `hashtags`    | String         | required                      | 해시태그 (JSON array string)             |
| `imagePrompt` | String?        | optional                      | 이미지 생성 프롬프트                     |
| `editedByUser`| Boolean        | `@default(false)`             | 사용자가 수정 저장한 적 있는지           |
| `usedFallback`| Boolean        | `@default(false)`             | mock fallback 발동 여부                  |
| `createdAt`   | DateTime       | `@default(now())`             |                                          |
| `updatedAt`   | DateTime       | `@updatedAt`                  | 사용자 편집 시 갱신                      |

**관계:** `analysis SdgAnalysis`

**인덱스:** `analysisId`, `type` (유형별 조회)

---

## 4. Enum 정의

```prisma
enum SdgGoal {
  SDG_8    // 양질의 일자리와 경제성장
  SDG_11   // 지속가능한 도시와 공동체
  SDG_12   // 책임 있는 소비와 생산
  SDG_17   // 목표를 위한 파트너십
}

enum ContentType {
  SNS_POST            // SNS 게시글
  CARD_NEWS           // 카드뉴스 문안
  SHORT_VIDEO_SCRIPT  // 숏폼 영상 대본
  CAMPAIGN_SLOGAN     // 캠페인 슬로건
}

enum SocialCategory {
  EMPLOYMENT     // 고용
  ENVIRONMENT    // 환경
  LOCAL_ECONOMY  // 지역경제
  COMMUNITY      // 공동체
  COOPERATION    // 협력
}
```

> SQLite는 enum을 내부적으로 string으로 저장하지만, Prisma 레벨에서 타입 안전성이 확보된다. enum 값 추가 시 마이그레이션 필요.

---

## 5. 정책

### 5.1 ID 전략

- **모든 PK는 `String @id @default(cuid())`**.
- URL-safe, 짧음(~25자), 정렬 힌트 포함, Prisma 기본 지원.

### 5.2 시간 추적

- 모든 엔티티에 `createdAt @default(now())` + `updatedAt @updatedAt`.
- 예외: `SdgMatch`는 `createdAt`만 (생성 후 수정 안 함).

### 5.3 Soft delete

- **No.** Hard delete만. MVP 단순화.
- 부모 삭제 시 자식 cascade delete (`onDelete: Cascade`).

### 5.4 배열 / 컬렉션 필드

- SQLite는 배열 직접 지원 X.
- `socialFunctions`, `keywords`, `hashtags` 같은 list는 **`String` 컬럼에 JSON.stringify**로 저장.
- Application 레이어(`src/server/`)에서 직렬화/역직렬화. 향후 PostgreSQL 이관 시 `String[]` 또는 `Json`으로 전환.

### 5.5 Validation

- DB 레벨 제약은 최소(타입·required·unique).
- 비즈니스 검증(점수 0~100, enum 값 유효성)은 **Route Handler 진입 시 zod**로 처리 — [ARCHITECTURE §6](ARCHITECTURE.md#6-에러-처리).

### 5.6 인덱스

- 모든 외래키에 인덱스 (Prisma는 SQLite에서 자동 생성하지 않으므로 명시).
- 추가 인덱스 후보: `SdgAnalysis.createdAt` (최근 분석 조회), `GeneratedContent.type` (유형별 조회).

---

## 6. 마이그레이션 전략

### 6.1 개발

```bash
pnpm db:migrate         # prisma migrate dev (마이그레이션 파일 생성 + 적용)
pnpm db:generate        # client 재생성 (postinstall에서 자동 실행)
pnpm db:studio          # GUI 확인
```

### 6.2 첫 마이그레이션

엔티티 5종 + enum 3종을 포함한 단일 마이그레이션으로 시작 (`init`).
이후 변경은 **위험 작업**으로 분류해 별도 PR + 사용자 검토.

### 6.3 운영 단계 전환 시

- SQLite → PostgreSQL 이관 검토 ([ADR-0001 트레이드오프](adr/0001-tech-stack.md#결과-및-트레이드오프))
- 배열 필드(`socialFunctions`, `keywords`, `hashtags`)를 native `String[]` 또는 `Json` 타입으로 전환
- enum 값 변경 시 데이터 마이그레이션 필요

---

## 7. 후속 검토 (현재 미적용)

| 항목                              | 비고                                                              |
|-----------------------------------|-------------------------------------------------------------------|
| `User` / 인증 엔티티              | MVP 범위 외. 추후 도입 시 별도 ADR                                 |
| `Tag` / 자유 태깅                 | 카테고리 enum이 충분하다면 불필요                                  |
| `ContentEdit` 이력                | 사용자 편집 이력 추적. MVP는 `editedByUser` 플래그만               |
| Full-text search (FTS5)           | SQLite FTS5 모듈. 검색 기능 도입 시 검토                          |
| 미디어/파일 저장                  | MVP는 텍스트 only. 이미지 첨부 도입 시 별도 설계                  |

---

## 변경 이력

- 2026-05-27: 초안 작성. 엔티티 5종 + enum 3종 확정.
