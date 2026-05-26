# GitHub 사용 가이드

D-Connect 팀(2~5명)을 위한 GitHub 협업 규칙이다.
새 팀원이 합류했을 때, 이 문서 하나만 읽으면 작업을 시작할 수 있도록 작성했다.

---

## 목차

1. [브랜치 전략](#1-브랜치-전략)
2. [커밋 메시지 규칙 (Conventional Commits)](#2-커밋-메시지-규칙-conventional-commits)
3. [Issue 규칙](#3-issue-규칙)
4. [Draft PR 규칙](#4-draft-pr-규칙)
5. [PR 규칙](#5-pr-규칙)
6. [GitHub Project 규칙](#6-github-project-규칙)
7. [main 브랜치 보호 규칙](#7-main-브랜치-보호-규칙)
8. [CI/CD 규칙](#8-cicd-규칙)
9. [Worktree 규칙](#9-worktree-규칙)
10. [AI 협업 규칙](#10-ai-협업-규칙)
11. [워크플로 예시 (end-to-end)](#11-워크플로-예시-end-to-end)

**부록**

- [부록 A: main 브랜치 보호 설정 명령어](#부록-a-main-브랜치-보호-설정-명령어)

---

## 1. 브랜치 전략

**GitHub Flow** 기반 — 단순하고 작은 팀에 적합하다.

- `main` — 항상 배포 가능한 상태. **직접 push 금지**. PR로만 변경한다.
- `feature/*`, `fix/*`, `chore/*` ... — 모든 작업은 main에서 분기한 브랜치에서 진행한다.
- 작업 완료 → PR 생성 → 리뷰 → main에 squash merge → 브랜치 삭제.

### 브랜치 네이밍 규칙

```
<type>/<issue-number>-<짧은-설명-kebab-case>
```

| type       | 용도                                     | 예시                             |
|------------|------------------------------------------|----------------------------------|
| `feature`  | 새 기능 추가                             | `feature/12-user-login`          |
| `fix`      | 버그 수정                                | `fix/34-login-redirect`          |
| `refactor` | 동작 변경 없이 코드 구조 개선            | `refactor/45-auth-module`        |
| `docs`     | 문서만 변경                              | `docs/56-update-readme`          |
| `chore`    | 빌드/설정/의존성 등 부수 작업            | `chore/67-bump-deps`             |
| `test`     | 테스트만 추가/수정                       | `test/78-login-edge-cases`       |

- 영문 소문자 + kebab-case를 사용한다.
- **Issue 번호는 필수** — 모든 브랜치는 대응되는 Issue에서 시작한다.
- Issue 없이 시작한 작업이라면(트리비얼 예외 제외) 먼저 Issue를 만들고 브랜치를 다시 만든다.

---

## 2. 커밋 메시지 규칙 (Conventional Commits)

```
<type>(<scope>): <subject>

<body (선택)>

<footer (선택)>
```

### type

| type       | 설명                                        |
|------------|---------------------------------------------|
| `feat`     | 새 기능 추가                                |
| `fix`      | 버그 수정                                   |
| `docs`     | 문서만 변경                                 |
| `style`    | 포맷팅 (코드 동작에 영향 없음)              |
| `refactor` | 리팩토링 (기능 변경 없음)                   |
| `test`     | 테스트 추가/수정                            |
| `chore`    | 빌드/설정/의존성 변경                       |
| `perf`     | 성능 개선                                   |
| `ci`       | CI 설정 변경                                |

### 규칙

- subject는 **명령형, 현재 시제, 50자 이내, 마침표 없음**.
- 한글 또는 영문 모두 가능 (팀 내에서 통일 권장).
- breaking change는 `feat!:` 또는 footer에 `BREAKING CHANGE:`로 명시한다.

### 예시

```
feat(auth): 카카오 로그인 추가
fix(api): 페이지네이션 off-by-one 오류 수정
docs: README에 로컬 실행 방법 추가
chore(deps): vite 5.2로 업데이트
```

---

## 3. Issue 규칙

### 언제 만드나

- **모든 작업 전에 Issue 먼저** — 작업 단위가 명확해지고, PR과 연결할 수 있다.
- 버그 발견 시 즉시 Issue — 본인이 고칠 거여도 기록을 남긴다.
- 5분 이내 트리비얼 수정은 Issue 생략 가능.

**단, 아래 작업은 작아도 Issue를 반드시 만든다.**

- 기능 동작 변경
- API 응답 변경
- DB schema 변경
- 인증/인가 관련 변경
- 결제 관련 변경
- 배포/CI 설정 변경
- AI 도구가 수행하는 작업

### 템플릿

`.github/ISSUE_TEMPLATE/` 에 3종 제공.

- `bug_report.md` — 버그 신고
- `feature_request.md` — 새 기능 제안
- `task.md` — 일반 작업 (할 일)

### 라벨

| 라벨                       | 의미                              |
|----------------------------|-----------------------------------|
| `type: bug`                | 버그                              |
| `type: feature`            | 새 기능                           |
| `type: refactor`           | 리팩토링                          |
| `type: docs`               | 문서                              |
| `type: test`               | 테스트                            |
| `type: chore`              | 잡일                              |
| `priority: high/mid/low`   | 우선순위                          |
| `status: blocked`          | 다른 작업/외부 요인에 막혀 있음   |
| `good first issue`         | 신규 합류자용                     |

> `type:` 라벨은 [§1 브랜치 타입](#1-브랜치-전략)과 1:1로 대응한다 (`bug` ↔ `fix` 브랜치).

### 할당과 진행

- Issue 잡기 = 본인 assign + Project에서 `In Progress`로 이동.
- 작업 시작했는데 막혔다면 코멘트 또는 `status: blocked` 라벨로 알린다.

---

## 4. Draft PR 규칙

**Draft PR을 적극 활용한다.** 작업 초기에 열어 두면 리뷰어가 방향성을 빨리 확인할 수 있다.

### 언제 Draft로 여나

- 작업이 30% 이상 진행되어 **방향을 공유하고 싶을 때**
- 큰 변경을 단계적으로 쌓을 때 (조기 피드백)
- WIP(work in progress) 상태로 동료에게 보여주고 싶을 때

### Draft 상태에서

- 리뷰는 명시적 요청 시에만 받는다 (`@사용자 봐주세요`).
- CI는 동일하게 돌지만 머지할 수 없다.
- 커밋 메시지는 임시여도 OK (머지 시 squash됨).

### Ready for review 전환 조건

다음 3가지를 모두 충족한 후 "Ready for review" 클릭.

- 셀프 리뷰 완료
- [PR 템플릿](../.github/pull_request_template.md)의 체크리스트 모두 충족
- CI green

---

## 5. PR 규칙

### 기본 원칙

- **하나의 PR = 하나의 목적** — 기능과 리팩토링을 섞지 않는다.
- PR 제목은 [커밋 메시지 규칙](#2-커밋-메시지-규칙-conventional-commits)과 동일하게 작성한다 (`feat(auth): ...`).
- 본문은 `.github/pull_request_template.md`가 자동 적용된다.

### PR 크기 규칙

- PR은 리뷰어가 **15~30분 안에 이해할 수 있는 크기**를 목표로 한다.
- 일반 코드 변경은 **±300줄 이하**를 권장한다.
- **1000줄을 넘으면 원칙적으로 쪼갠다.**
- 단, lockfile, generated file, snapshot, migration은 라인 수 계산에서 제외할 수 있다.
- 큰 PR이 불가피하면 PR 본문에 **"왜 쪼개기 어려운지"**를 설명한다.

### 리뷰

- 기본 리뷰어는 **최소 1명**.
- 4명 팀에서는 모든 PR에 2명 리뷰를 강제하지 않는다.
- 단, **[위험 작업](#위험-작업-기준)**은 **2명 리뷰를 권장**한다.
- 리뷰어는 가능하면 **24시간 내 1차 응답**한다.
- 작성자는 리뷰 코멘트에 모두 응답한다 (수정 / 거절 사유 / 감사 표시 중 하나).
- `Approve`, `Request changes`, `Comment`를 명확히 구분한다.

### 머지

- **Squash and merge로 통일** — 커밋 히스토리를 깔끔하게 유지한다.
- 머지 커밋 메시지는 PR 제목을 그대로 사용한다.
- 머지 후 브랜치는 자동 삭제한다 (repo 설정에서 활성화).

**머지 가능 조건**

1. CI 통과 (✓)
2. 리뷰 요건 충족 — 기본 1명 / 위험 작업 2명 Approve
3. main과 충돌 없음 — 충돌 시 작성자가 rebase 또는 main merge 후 재요청
4. 리뷰 코멘트 모두 해결됨

---

## 6. GitHub Project 규칙

GitHub Projects (board view)로 작업을 추적한다.

### 컬럼 구성

| 컬럼          | 의미                                              |
|---------------|---------------------------------------------------|
| `Backlog`     | 아직 시작하지 않은 일                             |
| `Todo`        | 이번 주/스프린트에 할 일                          |
| `In Progress` | 현재 작업 중 (1인당 최대 2개 권장)                |
| `In Review`   | PR 올렸고 리뷰 대기                               |
| `Done`        | 머지/종료됨                                       |

### 운영 규칙

- 모든 Issue/PR은 Project에 추가한다.
- 가능하면 GitHub Projects workflow로 자동 추가/자동 이동을 설정한다.
- 자동화가 누락되면 작성자가 직접 상태를 업데이트한다.
- 작업 시작 시 본인을 assign + `In Progress`로 이동한다.
- PR을 Ready for review로 전환하면 `In Review`로 이동한다.
- PR merge 또는 Issue close 시 `Done`으로 이동한다.
- 매주 1회 (예: 월요일 스탠드업) Backlog/Todo 우선순위를 점검한다.

---

## 7. main 브랜치 보호 규칙

GitHub Settings → Branches → Add rule로 설정한다.

### 적용 규칙

- ✅ **Require a pull request before merging** — 직접 push 금지
  - Required approvals: **1**
  - Dismiss stale reviews when new commits are pushed
- ✅ **Require status checks to pass** — CI 통과 필수
  - Require branches to be up to date before merging
  - Status check: **CI workflow의 실제 job 이름** (workflow 추가 후 등록)
- ✅ **Require conversation resolution before merging** — 리뷰 코멘트 해결 필수
- ✅ **Do not allow bypassing the above settings** — 관리자도 예외 없음
- ❌ Force push 금지 (기본값)
- ❌ Deletions 금지 (기본값)

> CLI로 일괄 적용하려면 [부록 A](#부록-a-main-브랜치-보호-설정-명령어)의 명령어를 참고.

---

## 8. CI/CD 규칙

### CI (Continuous Integration)

- 모든 PR에서 `.github/workflows/ci.yml`이 자동으로 실행된다.
- 통과해야 머지할 수 있다 (브랜치 보호 규칙으로 강제).

#### 최소 체크 항목

1. **Lint** — 코드 스타일 검사
2. **Type check** — 타입 안정성 (TS/Python 등)
3. **Test** — 단위/통합 테스트
4. **Build** — 빌드 성공 여부

#### 캐싱

의존성 캐시를 적극 사용해 CI 시간을 **5분 이내**로 유지한다.

### CD (Continuous Deployment) — 추후 정의

- 현재 단계: 수동 배포.
- 계획: main 머지 시 staging 자동 배포 → 검증 후 production 수동 승인.

---

## 9. Worktree 규칙

`git worktree`는 같은 repo의 여러 브랜치를 **각자 다른 디렉토리에서 동시에** 작업할 수 있게 한다.

### 사용을 권장하는 경우

- 리뷰 중인 PR을 로컬에서 확인하면서 본인 작업도 계속 진행하고 싶을 때
- 긴 빌드/테스트가 도는 동안 다른 브랜치에서 작업하고 싶을 때
- 긴급 fix 등 다른 브랜치에서 빠르게 작업해야 하는데, 현재 작업을 stash하지 않고 싶을 때

### 디렉토리 컨벤션

```
~/GitHub/d-connect/                       # main worktree (default)
~/GitHub/d-connect.wt/                    # 추가 worktree 모음 디렉토리
  feature-12-user-login/                  # 브랜치명 그대로 (슬래시 → 하이픈)
  fix-34-login-redirect/
```

### 기본 명령어

```bash
# 새 worktree 추가 (기존 브랜치)
git worktree add ~/GitHub/d-connect.wt/feature-12-user-login feature/12-user-login

# 새 브랜치와 함께 worktree 추가
git worktree add -b feature/12-user-login \
  ~/GitHub/d-connect.wt/feature-12-user-login

# 현재 worktree 목록
git worktree list

# 작업 끝난 worktree 정리
git worktree remove ~/GitHub/d-connect.wt/feature-12-user-login
```

### 주의사항

- 동일한 브랜치를 두 worktree에서 동시 체크아웃 불가.
- worktree 디렉토리는 `.gitignore` 무관 — 각자 로컬에만 존재.
- 머지/삭제된 브랜치의 worktree는 즉시 정리한다.

### AI 병렬 작업 시 Worktree 규칙

Codex/Claude Code를 여러 작업에 동시에 사용할 때는 **반드시 worktree 또는 별도 clone**을 사용한다.

- 같은 브랜치에서 두 AI 도구를 동시에 실행하지 않는다.
- 같은 파일을 여러 AI가 동시에 수정하지 않게 한다.
- AI 작업 하나당 하나의 worktree를 사용한다.
- 작업 종료 후 PR merge 또는 branch 삭제가 끝나면 worktree를 정리한다.

예시:

```bash
git checkout main
git pull

git worktree add -b feature/23-login-api \
  ~/GitHub/d-connect.wt/feature-23-login-api main
git worktree add -b fix/41-login-redirect \
  ~/GitHub/d-connect.wt/fix-41-login-redirect main
```

---

## 10. AI 협업 규칙

### AI 작업 기본 원칙

Codex, Claude Code 등 AI 도구도 팀원과 동일한 GitHub 규칙을 따른다.

- AI도 main에 직접 push하지 않는다.
- AI 작업도 반드시 Issue 기준으로 진행한다.
- 하나의 AI 작업 = 하나의 Issue, 하나의 Branch, 하나의 PR.
- AI가 만든 PR도 사람 리뷰 없이 merge하지 않는다.
- AI가 만든 변경도 CI를 통과해야 한다.
- AI에게 큰 작업을 한 번에 맡기지 말고, 작은 Issue 단위로 맡긴다.

### 위험 작업 기준

다음 변경은 **위험 작업**으로 분류하고, 일반 PR보다 엄격한 절차를 따른다.

- production dependency
- DB schema/migration
- 인증/인가
- 결제
- 배포 workflow
- secret/env/token
- GitHub Actions 권한
- main branch protection

위험 작업에는 다음 규칙이 추가로 적용된다.

- **2명 리뷰 권장** ([§5 - 리뷰](#리뷰) 참고)
- **AI는 임의로 merge하거나 적용하면 안 된다** — 사람이 검토하고 승인한 후에만 진행한다.

### AI 작업 지시 예시

````text
Issue #23을 구현해줘.

규칙:
- feature/23-user-login 브랜치에서 작업해.
- 먼저 구현 계획을 작성해.
- 기존 코드 스타일을 따라.
- 테스트를 추가해.
- lint, typecheck, test를 실행해.
- 완료 후 Draft PR을 만들어.
- PR 본문에 변경 요약, 테스트 결과, 리스크를 작성해.
````

### AI 리뷰

PR 작성 후 필요하면 다음과 같이 AI 리뷰를 요청한다.

```
@claude review this PR for correctness and regressions
```

AI 리뷰는 **보조 수단**이며, 최종 approve와 merge는 사람이 담당한다.

---

## 11. 워크플로 예시 (end-to-end)

### 작업 유형별 표준 흐름

**일반 작업**

```
Issue → Branch → Draft PR → CI → 1명 리뷰 → Squash merge
```

**위험 작업** ([기준](#위험-작업-기준))

```
Issue → Branch → Draft PR → CI → AI 리뷰 → 2명 리뷰 권장 → Squash merge
```

**AI 작업**

```
Issue → AI에게 작은 단위로 지시 → 별도 branch/worktree
      → Draft PR → CI → AI 리뷰 → 사람 리뷰 → Squash merge
```

### 상세 예시 — 새 기능 추가

새 기능 "사용자 프로필 페이지"를 추가한다고 가정 (Issue #12).

1. **Issue 생성** — `feature_request.md` 템플릿으로 작성. 라벨: `type: feature`, `priority: mid`.
2. **본인 assign** + Project에서 `Todo` → `In Progress`.
3. **브랜치 분기** (Issue 번호를 브랜치명에 포함)
   ```bash
   git checkout main && git pull
   git checkout -b feature/12-user-profile
   ```
4. **작업 + 커밋** — Conventional Commits 규칙 준수.
   ```bash
   git commit -m "feat(profile): 프로필 페이지 라우트 추가"
   ```
5. **Draft PR 열기** — 방향성 확인용으로 일찍.
   ```bash
   git push -u origin feature/12-user-profile
   gh pr create --draft \
     --title "feat(profile): 사용자 프로필 페이지" \
     --body-file ...
   ```
6. **작업 완료** → 셀프 리뷰 → "Ready for review" 전환 → 리뷰어 지정.
7. **리뷰 반영** → 모든 코멘트 해결 → CI green → Approve.
   - 필요 시 `@claude review this PR for correctness and regressions`로 AI 리뷰 병행.
8. **Squash merge** → 브랜치 자동 삭제 → Issue 자동 close (PR 본문에 `Closes #12` 포함 시).

---

## 부록 A: main 브랜치 보호 설정 명령어

`gh` CLI로 적용하려면 JSON body를 명시적으로 전달한다.

> `<CHECK_NAME>`은 PR 화면의 Checks 탭에 표시되는 실제 check 이름으로 바꾼다.
> 현재 프로젝트의 CI workflow는 `build` 한 개를 사용한다.

```bash
gh api \
  --method PUT \
  repos/dongwandev/d-connect/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "<CHECK_NAME>" }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON
```

### 솔로 작업 임시 정책

팀이 합류하기 전, collaborator가 1명뿐이라면 본인이 본인 PR을 approve할 수 없어 모든 머지가 막힌다. 이 기간 동안만 `required_approving_review_count`를 **0**으로 두고 운영한 뒤, 팀 합류 시 1로 복원한다.

```bash
# 솔로 모드: review count 0
gh api \
  --method PATCH \
  repos/dongwandev/d-connect/branches/main/protection/required_pull_request_reviews \
  -F required_approving_review_count=0

# 팀 합류 시 복원
gh api \
  --method PATCH \
  repos/dongwandev/d-connect/branches/main/protection/required_pull_request_reviews \
  -F required_approving_review_count=1
```

### 주의

- `context` 값은 실제 CI check 이름과 정확히 일치해야 한다.
- workflow/job 이름이 바뀌면 branch protection의 required check도 함께 수정한다.
- `required_linear_history: true`를 쓰려면 repository에서 squash merge 또는 rebase merge가 허용되어 있어야 한다.
- 과거 문서의 `contexts: []` + `checks: [...]` 동시 지정 형태는 API schema 충돌(HTTP 422)을 일으킨다. 위 예시처럼 **`checks`만** 사용한다. `app_id`는 GitHub Actions check의 경우 자동 해결된다.

---

## 변경 이력

- 2026-05-26 — 초안 작성 후 동일자 다회 보강. 목차 도입, 브랜치 네이밍에 Issue
  번호 필수화 및 `hotfix` 타입 제거, Conventional Commits / Issue / Draft /
  PR / Project / main 보호 / CI·CD / Worktree(+ AI 병렬) / AI 협업(기본 원칙
  · 위험 작업 기준 일원화 · 작업 지시 예시 · AI 리뷰) / 작업 유형별 표준 흐름
  (일반 · 위험 · AI) 정립. 부록 A를 JSON body 방식으로 정리.
- 2026-05-26 — 최적화 패스. 톤을 "~한다"로 통일, 앵커 링크를 정확한 서브섹션
  으로 교정, §5의 머지 항목 통합 및 중복 제거, Issue 라벨에 `refactor`/`test`
  추가, Worktree 명령어 경로를 절대 경로로 일관화, §7 status check 표기를
  부록 A와 정합, 부록을 목차에서 시각적으로 분리.
