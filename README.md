# D-Connect

대전·세종·충남권 소상공인 및 사회적경제기업이 지역사회 기여 활동을 **SDGs와 연결해 공공홍보 콘텐츠로 활용**할 수 있도록 돕는 AI 기반 웹 프로토타입.

> 부트캠프 프로젝트 — 2026-05-14 ~ 2026-07-08 (8주)
> 발표 시연: **2026-06-25**

---

## 문서

- ⚡ [개발 환경 셋업 가이드](docs/SETUP.md) — 신규 팀원 필독
- 📋 [PRD — 제품 요구사항](docs/PRD.md)
- 🏛️ [ADR-0001 — 기술 스택](docs/adr/0001-tech-stack.md) · [ADR-0002 — LLM Provider](docs/adr/0002-llm-provider.md)
- 🤝 [GitHub 협업 가이드](docs/GITHUB_GUIDE.md)
- 🤖 [CLAUDE.md — AI 협업 컨텍스트](CLAUDE.md)
- 🗂️ [`docs/`](docs/) 전체 보기

## 기술 스택

- **Framework**: Next.js 16 (App Router) · TypeScript
- **Styling**: Tailwind CSS 4
- **DB / ORM**: SQLite + Prisma *(예정)*
- **AI**: Anthropic Claude API *(Sonnet 4.7 기본)*
- **Package Manager**: pnpm

상세 의사결정은 ADR-0001 / ADR-0002 참고.

## 시작하기

**처음 합류한 팀원은 [팀원 개발 환경 셋업 가이드](docs/SETUP.md)를 단계별로 따라 진행한다 (약 15~30분).**

이미 환경이 셋업된 팀원의 일상 명령어:

```bash
pnpm install          # 의존성 (postinstall: prisma generate)
pnpm dev              # 개발 서버 (http://localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm db:generate      # Prisma Client 재생성
pnpm db:migrate       # 마이그레이션 적용
pnpm db:studio        # Prisma Studio GUI
```

### 환경 변수

`.env` 파일에 아래 값을 설정한다. 자세한 안내는 [SETUP.md §6](docs/SETUP.md#6-환경-변수-env-설정) 참고.

```bash
ANTHROPIC_API_KEY=""              # 비워도 OK — mock 응답으로 폴백
LLM_MODEL_DEFAULT="claude-sonnet-4-7-latest"
LLM_MODEL_FAST="claude-haiku-4-7-latest"
DATABASE_URL="file:./dev.db"
```

> 키가 없거나 호출이 실패해도 mock 응답으로 흐름이 유지되어야 한다 (PRD §5.2).

## 기여

- 모든 작업은 [GitHub 협업 가이드](docs/GITHUB_GUIDE.md)를 따른다 — Issue → Branch → Draft PR → CI → 리뷰 → squash merge.
- [위험 작업](docs/GITHUB_GUIDE.md#위험-작업-기준)은 2명 리뷰 권장.

## 라이선스

미정 (부트캠프 종료 후 결정).
