# ADR 0005: 멀티테넌시 모델

- **상태:** Accepted
- **작성일:** 2026-05-28
- **작성자:** D-Connect 팀
- **관련 문서:** [PRD](../PRD.md), [ADR-0004 인증](0004-auth.md), [DB_SCHEMA](../DB_SCHEMA.md), [ARCHITECTURE](../ARCHITECTURE.md)

---

## 컨텍스트

2026-05-28 결정으로 다중 사용자 플랫폼으로 전환. 각 회원이 자신의 기업·분석·콘텐츠만 보고 수정할 수 있어야 한다.

핵심 제약:

- MVP 일정 — 복잡한 권한 모델(역할/그룹/조직) 도입 시 일정 압박
- 발표 시연용 시드 계정도 같은 모델 아래에서 동작해야 함
- 같은 기업을 여러 사용자가 공유하는 시나리오는 **MVP 범위 외** (PRD §6)

---

## 결정

**User-owned 모델 — 회원당 본인 기업·자식 데이터만 접근.**

```
User (1)──(N) Company (1)──(N) Activity
                │
                └──(N) SdgAnalysis ──(N) SdgMatch
                                    └──(N) GeneratedContent
```

- 모든 \`Company\` 행에 \`userId\` 외래키.
- 권한 체크는 **Route Handler 진입 시** session.userId vs DB row.userId 비교.
- 자식 데이터(Activity / SdgAnalysis / SdgMatch / GeneratedContent)는 **별도 userId를 두지 않는다.** Company를 통해 간접 권한 검증한다 (성능 우려 시 추후 비정규화).

### 권한 체크 패턴

각 보호 Route에서 다음 패턴을 반복한다:

```ts
const session = await auth()
if (!session?.user?.id) throw new ApiError('UNAUTHORIZED', '...', 401)

const company = await db.company.findFirst({
  where: { id, userId: session.user.id },
})
if (!company) throw new ApiError('NOT_FOUND', '...', 404)
// (의도: '본인 기업이 아니면 존재 사실 자체를 노출하지 않는다.')
```

자식 리소스(예: SdgAnalysis) 접근 시에는 join으로 검증:

```ts
const analysis = await db.sdgAnalysis.findFirst({
  where: { id, company: { userId: session.user.id } },
})
```

### 에러 응답 정책

- 본인 소유가 아닌 리소스 접근 → **`404 NOT_FOUND`** 반환 (존재 자체를 숨김)
- 세션 없이 접근 → **`401 UNAUTHORIZED`**
- 새 에러 코드 \`UNAUTHORIZED\` 추가 (errors.ts ApiErrorCode 확장)

### 시드 계정

- 이메일: \`demo@d-connect.kr\`
- 용도: 시연 데모 + 기존 익명 등록 데이터 귀속
- 마이그레이션 시 \`Company\` 행 중 \`userId\`가 비어 있는 것은 모두 시드 계정에 귀속

---

## 대안

| 후보                       | 채택 | 사유                                                            |
|----------------------------|------|-----------------------------------------------------------------|
| **User-owned (선택)**      | ✅    | MVP 단순, 권한 모델 명확                                         |
| Organization 모델          | ❌    | User → Org 멤버십, Org → Company 소유. 기능 풍부하나 복잡        |
| Row-level security (DB)    | ❌    | SQLite 미지원. 향후 PostgreSQL 이관 시 검토                      |
| Shared 기본 + ACL          | ❌    | 시연 일정에 부담                                                 |
| 자식 모두에 userId 비정규화 | ⏳    | 성능 이슈 발생 시 후속 적용 가능 (현재 데이터 규모로는 불필요)    |

---

## 결과 및 트레이드오프

### 긍정

- 권한 로직이 단순 (companyId + userId 1-line check)
- 시연 시 다중 계정 데모 가능 (심사위원이 직접 로그인해도 본인 데이터 깨끗하게 표시)
- 향후 Organization 모델로 자연스럽게 확장 (Company.userId → Company.ownerId 유지하고 Membership 테이블 추가)

### 부정 / 위험

| 위험                                                   | 영향도 | 완화                                                            |
|--------------------------------------------------------|--------|-----------------------------------------------------------------|
| 자식 리소스 접근마다 join 발생                          | 낮음   | MVP 규모에 무관, PostgreSQL 이관 시 인덱스 최적화                |
| Route Handler 모두에 권한 체크 반복 (보일러플레이트)   | 중     | 향후 보호 wrapper(`withAuth`)나 RLS로 추상화 검토               |
| 권한 누락 위험 (Route에 체크 안 하면 다른 사용자 접근) | 높음   | 코드 리뷰 + 단위 테스트로 검증                                  |
| 시연 데모 시 시드 데이터 노출 우려                      | 낮음   | 시드 계정은 발표 끝나면 삭제                                    |

---

## 후속 결정

- **Route Handler에 권한 wrapper 도입** — `withAuth(handler)` 형태 (보일러플레이트 줄임). 1-C 이후 평가.
- **자식 리소스에 userId 비정규화** — 성능 이슈 보일 때
- **Organization 모델 도입** — MVP 이후, 운영 단계 진입 시

---

## 변경 이력

- 2026-05-28: 초안 작성 및 채택.
