---
description: D-Connect 개발 환경을 점검하고 누락된 도구 설치를 안내합니다 (Mac/Windows/Linux 자동 감지)
---

# /setup-env — D-Connect 개발 환경 셋업

## 너의 임무

사용자가 D-Connect 프로젝트를 로컬에서 개발할 수 있도록 환경을 점검·설치·검증한다.
사용자는 보통 부트캠프 팀원이며 Node/Git/pnpm 친숙도가 다양하다. **친절하고, 안전하게, 단계별로** 진행한다.

이 명령이 끝나면 사용자는:

- `pnpm dev`로 개발 서버를 띄울 수 있다.
- `pnpm lint && pnpm typecheck && pnpm build`가 모두 통과한다.
- `git` / `gh` CLI가 인증되어 PR 워크플로를 쓸 수 있다.

---

## 절대 규칙 (위반 금지)

1. **시스템 도구 설치(node, pnpm, gh 등)는 반드시 사용자 명시 확인 후** 실행한다. 임의 실행 금지.
2. **기존 `.env`는 절대 덮어쓰지 않는다.** 존재 시 건너뛴다.
3. **`git config --global`은 사용자가 요청한 경우에만** 수정한다.
4. **각 단계의 명령어와 결과**를 사용자에게 보여준다. 침묵 실행 금지.
5. 한 단계가 실패하면 **즉시 멈추고** 원인과 다음 액션을 보고한다. 임의로 다음 단계로 넘어가지 않는다.

---

## 진행 절차

각 단계는 (a) **확인 명령** → (b) **결과 해석** → (c) **필요시 조치** → (d) **검증** 순으로 진행한다.

### 0. 위치 확인

```bash
pwd
ls package.json
```

- `package.json`이 없거나, `"name": "d-connect"`가 아니면 → 사용자에게 "D-Connect 저장소 루트에서 다시 실행해주세요"라고 안내하고 즉시 종료.

### 1. OS 감지

```bash
uname -s
```

분류:

- `Darwin` → **macOS**
- `Linux` → **Linux** (macOS와 거의 동일)
- `MINGW*` / `MSYS*` / `CYGWIN*` → **Windows (Git Bash)**
- 위 명령이 실패하면 PowerShell일 가능성 → 사용자에게 "Git Bash 또는 PowerShell 중 어느 쪽에서 실행 중인가요?" 확인

이후 단계의 명령어는 감지된 OS에 맞춰 선택한다.

### 2. Node.js (≥ 22) 확인

```bash
node --version
```

- 출력이 `v22.x.x` 이상 → 통과
- 미설치 또는 `v22` 미만 →
  - **사용자에게 알린다**: "Node.js 22 LTS 이상이 필요합니다. 현재 버전: <X>"
  - 설치 방법을 OS에 맞춰 **제시**한다.
    - macOS (nvm): `nvm install 22 && nvm use 22 && nvm alias default 22`
    - macOS (brew): `brew install node@22 && brew link node@22`
    - Windows (nvm-windows): `nvm install 22 && nvm use 22`
    - Windows (winget): `winget install OpenJS.NodeJS.LTS`
  - **확인을 받고 나서**만 실행한다. 사용자가 직접 다른 방식으로 설치하길 원하면 그 결과만 알려주고 다음 단계로.

### 3. Git 확인

```bash
git --version
git config --global --get user.name || true
git config --global --get user.email || true
```

- `git --version` 출력이 없으면 → 설치 안내 (macOS: `xcode-select --install` / Windows: Git for Windows 설치 링크)
- `user.name` / `user.email`이 비어 있으면 → 사용자에게 **본인의 GitHub 아이디·이메일을 묻고**, 사용자 확인 후 다음 명령 실행:
  ```bash
  git config --global user.name "<입력값>"
  git config --global user.email "<입력값>"
  ```
- Windows 사용자라면 추가로 권장:
  ```bash
  git config --global core.autocrlf input
  ```
  (사용자 확인 후 실행)

### 4. pnpm 확인

```bash
pnpm --version
```

- 출력이 `11.x` 이상이면 통과
- 미설치 시 → "pnpm을 설치하시겠습니까? (`npm install -g pnpm`)" 사용자 확인 후 실행
- `corepack`이 사용 가능하면 corepack 경유도 가능하지만, **기본 권장은 `npm i -g pnpm`** (Node 일부 빌드에서 corepack이 빠져 있다)

### 5. 의존성 설치

```bash
pnpm install
```

- 출력에서 `Done in Xs`를 확인.
- `ERR_PNPM_IGNORED_BUILDS` 경고가 보이면 → 이미 `pnpm-workspace.yaml`에 `allowBuilds`가 정의되어 있다. `pnpm install --force` 재시도 후에도 같으면 사용자에게 경고 전문을 보여주고 멈춤.
- `postinstall`이 자동으로 `prisma generate`를 돌린다. `src/generated/prisma/` 디렉토리가 만들어졌는지 `ls src/generated/prisma | head -5`로 확인.

### 6. `.env` 생성

```bash
test -f .env && echo "EXISTS" || echo "MISSING"
```

- `EXISTS` → 절대 덮어쓰지 말 것. "기존 .env를 보존했습니다"라고 알리고 통과.
- `MISSING` → `.env.example`을 복사:
  - macOS / Linux / Git Bash: `cp .env.example .env`
  - Windows PowerShell: `Copy-Item .env.example .env`
- 복사 후 사용자에게 **자세히 안내**한다:
  - "에디터에서 `.env`를 열어 다음 값을 채우세요:"
  - `ANTHROPIC_API_KEY` — Anthropic 콘솔에서 발급. 비어 있어도 OK (mock 응답으로 폴백).
  - `LLM_MODEL_DEFAULT` / `LLM_MODEL_FAST` — 잠정 ID. 실제 Anthropic 콘솔에서 현재 모델 ID 확인 후 갱신.
  - `DATABASE_URL` — `file:./dev.db` 그대로 둔다 (로컬 SQLite).

### 7. 품질 점검 (CI와 동일)

세 명령을 순서대로 실행. **하나라도 실패하면 즉시 보고하고 중단.**

```bash
pnpm lint
pnpm typecheck
pnpm build
```

- 각 명령의 결과를 사용자에게 보고.
- 빌드 성공 메시지(`✓ Generating static pages...`)를 확인.

### 8. GitHub CLI (`gh`) 확인

```bash
gh --version
gh auth status
```

- 미설치 시 → 사용자 확인 후 설치:
  - macOS: `brew install gh`
  - Windows: `winget install GitHub.cli`
- 미인증 시 → 사용자에게 안내: `gh auth login`을 실행하라고. (브라우저 인증이 필요하므로 사용자가 직접 진행해야 한다 — 명령어만 제공하고 사용자에게 결과를 알려달라고 요청.)

### 9. 최종 보고

다음 형식으로 사용자에게 요약한다:

```
✅ 환경 셋업 완료

| 항목                    | 상태  | 비고                            |
|-------------------------|-------|---------------------------------|
| Node.js                 | ✅    | v22.x.x                         |
| Git (user.name/email)   | ✅/❌  | <설정값 또는 미설정>             |
| pnpm                    | ✅    | 11.x.x                          |
| 의존성                  | ✅    | pnpm install 통과                |
| .env                    | ✅    | 신규 생성 / 기존 보존            |
| lint / typecheck / build | ✅    | 모두 통과                        |
| gh auth                 | ✅/❌  | <로그인 계정 또는 미인증>        |

다음 단계:
  1) pnpm dev — 개발 서버 (http://localhost:3000)
  2) docs/GITHUB_GUIDE.md 일독 — 협업 워크플로
  3) CLAUDE.md 일독 — AI 사용 컨텍스트
```

---

## 마지막 점검

- 어떤 단계에서든 사용자가 "건너뛰자"고 하면 그 단계는 ❌(스킵)으로 표시하고 통과.
- 사용자가 환경 정보를 노출하기 싫어하면(예: 이메일) 알려주는 정도까지만 하고 본인이 직접 설정하도록 안내.
- 모든 명령 출력은 가능한 한 가공 없이 사용자에게 보여주되, 너무 길면 마지막 20줄로 요약.
