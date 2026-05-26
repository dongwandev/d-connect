# CLAUDE.md

> AI 코딩 도구(Claude Code, Codex 등)가 D-Connect를 다룰 때 매 세션 시작 시 읽는 컨텍스트 문서.
> 본 문서는 **간결성 + 최신성**이 생명이다. 길어진다면 별도 문서로 분리할 것.

---

## 프로젝트 개요

**D-Connect** — 대전·세종·충남권 소상공인·사회적경제기업의 지역사회 기여 활동을 **SDGs와 연결해 공공홍보 콘텐츠로 활용**하도록 돕는 AI 기반 웹 프로토타입.

- **일정**: 2026-05-14 ~ 2026-07-08 (8주)
- **개발 집중 기간**: 2026-05-28 ~ 06-17 (3주)
- **발표 시연 마감**: **2026-06-25**
- **상세**: [`docs/PRD.md`](docs/PRD.md)

### 현재 단계 (수시 업데이트)

- 2주차 (2026-05-26 기준): 기획·문서·인프라 셋업 단계. 코드 골격은 빈 Next.js 페이지 + Prisma schema(모델 없음). 본격 구현은 5/28부터.

---

## 기술 스택

| 영역             | 선택                                       | 비고                                              |
|------------------|--------------------------------------------|---------------------------------------------------|
| Framework        | Next.js 16 (App Router) + TypeScript       | 풀스택 단일 코드베이스                            |
| Styling          | Tailwind CSS 4                             | App Router와 친화적                               |
| DB / ORM         | SQLite + Prisma 7                          | 시연 안정성 위해 파일 기반                        |
| AI               | Anthropic Claude API (Sonnet 4.7 기본)     | 백엔드 경유 호출, mock fallback                   |
| 응답 검증        | zod                                        | Tool Use 응답 스키마 검증                         |
| 패키지 매니저    | pnpm 11.3                                  | `packageManager` 필드로 고정                      |

상세 의사결정 — [ADR-0001](docs/adr/0001-tech-stack.md) · [ADR-0002](docs/adr/0002-llm-provider.md)

---

## 코드 스타일·규칙

- **TypeScript strict** — `any` 회피, 타입 명시
- **ESLint** — `eslint-config-next` 기반. `pnpm lint`로 자동 점검
- **포맷** — ESLint 룰에 위임 (Prettier 별도 도입 미정)
- **주석** — 한글 OK. **왜**를 적되 무엇은 적지 않는다 (코드로 표현)
- **커밋** — Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` ...). [상세](docs/GITHUB_GUIDE.md#2-커밋-메시지-규칙-conventional-commits)
- **PR 크기** — 일반 ±300줄 이하 / 1000줄 초과 시 쪼개기. lockfile·migration·snapshot 제외 가능
- **브랜치 네이밍** — `<type>/<issue-number>-<설명>` 형태. Issue 번호 필수.
- **머지** — Squash merge만, branch 자동 삭제

---

## 워크플로 (필독)

모든 변경은 다음 흐름을 따른다. **AI도 동일하게 따른다.**

```
Issue → Branch → Draft PR → CI → (리뷰) → Squash merge → Issue auto-close
```

- main 직접 push 금지 (브랜치 보호 적용됨)
- PR 본문에 `Closes #N` 포함 시 Issue 자동 close
- 현재는 솔로 친화 정책 — `required_approving_review_count: 0` (CI만 통과하면 본인 머지 가능)
- 팀 합류 시 review count를 1로 복원

[상세 워크플로](docs/GITHUB_GUIDE.md) · [표준 흐름](docs/GITHUB_GUIDE.md#11-워크플로-예시-end-to-end)

---

## ⚠️ 위험 작업 — AI는 임의 진행 금지

다음 변경은 **위험 작업**이다. AI는 PR까지만 만들고, **사람이 검토·승인·머지**한다.

- production dependency 추가
- DB schema / migration 변경
- 인증·인가 로직 변경
- 결제 로직 변경
- 배포 workflow 변경
- secret / env / token 관련 변경
- GitHub Actions 권한 변경
- main branch protection 변경

[기준 상세](docs/GITHUB_GUIDE.md#위험-작업-기준)

---

## 자주 사용하는 명령어

### 개발

```bash
pnpm install          # 의존성 설치 (postinstall: prisma generate)
pnpm dev              # 개발 서버 (http://localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm start            # 빌드 결과 실행
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
```

### 데이터베이스 (Prisma)

```bash
pnpm db:generate      # Prisma Client 재생성 (src/generated/prisma/)
pnpm db:migrate       # 마이그레이션 생성·적용 (dev)
pnpm db:studio        # Prisma Studio (GUI)
```

### Git / GitHub 워크플로

```bash
# 새 작업 시작 (Issue 번호 예: 12)
git checkout main && git pull
git checkout -b feature/12-some-feature

# Draft PR
git push -u origin feature/12-some-feature
gh pr create --draft --title "..." --body-file ...

# Ready for review → Squash merge → branch 삭제
gh pr ready <N>
gh pr merge <N> --squash --delete-branch

# 머지 후 동기화
git checkout main && git pull
```

### AI 리뷰 (선택)

```
@claude review this PR for correctness and regressions
```

---

## 디렉토리 구조

```
d-connect/
├── src/
│   ├── app/                  # Next.js App Router (페이지·라우트 핸들러)
│   └── generated/prisma/     # Prisma Client (gitignored)
├── prisma/
│   └── schema.prisma         # DB 스키마 (모델은 DB_SCHEMA.md 합의 후 정의)
├── public/                   # 정적 자원
├── docs/
│   ├── PRD.md                # 제품 요구사항
│   ├── GITHUB_GUIDE.md       # 협업 가이드
│   ├── adr/                  # 의사결정 기록
│   └── (ARCHITECTURE / DB_SCHEMA / API / TEST_PLAN — 스켈레톤)
├── .github/
│   ├── workflows/ci.yml      # lint / typecheck / build
│   ├── ISSUE_TEMPLATE/       # bug / feature / task
│   └── pull_request_template.md
├── .env.example              # 환경 변수 템플릿
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml       # build script 허용 목록
├── prisma.config.ts          # Prisma 7 config (dotenv 기반)
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 보안·운영 주의사항

- **API 키 클라이언트 노출 금지** — `ANTHROPIC_API_KEY`는 서버(Route Handler)에서만 사용. 클라이언트 컴포넌트로 전달 금지.
- **AI 호출 mock fallback 필수** — `ANTHROPIC_API_KEY` 부재 / 호출 실패 / 30초 타임아웃 시 동일 스키마의 mock 응답 반환. PRD §5.2.
- **AI 출력 톤 가드** — 광고성·과장·검증되지 않은 수치 회피. PRD §5.3.
- **`.env` 커밋 금지** — `.gitignore`에 `.env*` 포함. `.env.example`만 커밋.
- **모델 ID는 환경변수** — `LLM_MODEL_DEFAULT`, `LLM_MODEL_FAST`. 코드에 하드코딩 금지.

---

## 자주 헷갈리는 것

- **Prisma 7은 `prisma-client` generator를 기본 사용** — 구버전(`prisma-client-js`)이 아닌 새 형태. 출력 경로: `src/generated/prisma/` (gitignored)
- **pnpm build script 승인** — sharp, unrs-resolver, prisma 등은 `pnpm-workspace.yaml`의 `allowBuilds`에 등록되어 있음. 새 native 의존성 추가 시 이곳 갱신
- **Tailwind 4 + PostCSS** — `@tailwindcss/postcss` 플러그인 사용. v3와 설정 방식 다름
- **App Router의 server vs client component** — `'use client'` 지시어로 명확히 구분. AI 호출 / DB 접근 코드는 server에만

---

## 빠른 참조 링크

- [PRD](docs/PRD.md) — 제품 요구사항
- [GITHUB_GUIDE](docs/GITHUB_GUIDE.md) — 워크플로 규칙
- [ADR-0001](docs/adr/0001-tech-stack.md) · [ADR-0002](docs/adr/0002-llm-provider.md) — 기술 의사결정
- [GitHub Repo](https://github.com/dongwandev/d-connect)

---

## 변경 이력

- 2026-05-26: 초안 작성. 현재 인프라 셋업 단계 기준.
