# 팀원 개발 환경 셋업 가이드

처음 합류한 팀원이 **15~30분 안에 `pnpm dev`를 띄울 수 있도록** 단계별로 안내한다.

- 대상 OS: macOS · Windows (Linux도 macOS 명령어와 유사)
- 한 번에 한 단계씩 진행하고, 각 단계 끝의 **검증** 항목으로 통과 여부를 확인한다.
- 막히는 부분이 있으면 §[트러블슈팅](#트러블슈팅) 또는 팀 채널에 즉시 물어본다.

---

## 0. 사전 준비물 체크

| 항목                | 권장 버전 / 비고                                   |
|---------------------|----------------------------------------------------|
| **Node.js**         | 22 LTS 이상 (24 LTS 권장)                          |
| **Git**             | 2.40+                                              |
| **GitHub 계정**     | repo `dongwandev/d-connect` collaborator 권한 필요 |
| **Anthropic API 키** | 선택 — 없으면 mock 응답으로 동작                  |
| **에디터**          | VS Code 권장 (또는 Cursor / WebStorm)              |

> 권한이 없으면 슬랙·디스코드 등으로 팀장(@dongwandev)에게 GitHub 아이디를 알려 collaborator 초대를 받는다.

---

## 1. Node.js 22 LTS 설치

### macOS

`nvm`(권장) 또는 `brew`로 설치한다.

```bash
# nvm 설치 (이미 있다면 건너뜀)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 셸 재시작 후
nvm install 22
nvm use 22
nvm alias default 22
```

또는 brew:

```bash
brew install node@22
brew link node@22
```

### Windows

`nvm-windows` 권장.

1. [nvm-windows 릴리즈](https://github.com/coreybutler/nvm-windows/releases)에서 `nvm-setup.exe` 설치
2. **관리자 권한 PowerShell**에서:

```powershell
nvm install 22
nvm use 22
```

또는 winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

### 검증

```bash
node --version   # v22.x.x 이상이면 OK
npm --version    # 10.x 이상
```

---

## 2. Git 설치 & 계정 설정

### 설치

- **macOS**: `xcode-select --install` 또는 `brew install git`
- **Windows**: [Git for Windows](https://git-scm.com/download/win) 설치 (Git Bash 포함)

### 본인 계정 설정 (한 번만)

```bash
git config --global user.name "<GitHub 아이디>"
git config --global user.email "<GitHub 이메일>"

# Windows에서 줄바꿈 자동 변환 (권장)
git config --global core.autocrlf input
```

### 검증

```bash
git --version
git config --global --get user.name
git config --global --get user.email
```

---

## 3. 저장소 클론

작업 폴더를 정한 뒤(예: `~/GitHub`) clone 한다.

```bash
mkdir -p ~/GitHub && cd ~/GitHub

# HTTPS (가장 단순)
git clone https://github.com/dongwandev/d-connect.git

cd d-connect
```

> SSH 키를 등록한 팀원은 `git clone git@github.com:dongwandev/d-connect.git`로 진행해도 좋다.

### 검증

```bash
git status                # On branch main / nothing to commit
git log --oneline -3      # 최근 3개 커밋이 보임
```

---

## 4. pnpm 설치

본 프로젝트는 **pnpm 11.3.0** (package.json의 `packageManager` 필드로 고정)을 사용한다.

```bash
# 가장 단순한 방법 (모든 OS)
npm install -g pnpm
```

### 검증

```bash
pnpm --version    # 11.x.x 이상
```

---

## 5. 의존성 설치

```bash
pnpm install
```

설치가 끝나면 `postinstall` 훅이 자동으로 `prisma generate`를 실행해 Prisma Client를 만든다 (`src/generated/prisma/`).

### 검증

- 오류 메시지 없이 `Done in Xs` 출력
- `node_modules/` 디렉토리 생성
- `src/generated/prisma/client.ts` 등 파일 존재

> `[ERR_PNPM_IGNORED_BUILDS]` 경고가 보이면 §[트러블슈팅](#pnpm-build-script-승인-경고)을 참고.

---

## 6. 환경 변수 (.env) 설정

`.env.example`을 복사해 `.env` 파일을 만든다.

### macOS

```bash
cp .env.example .env
```

### Windows (PowerShell)

```powershell
Copy-Item .env.example .env
```

### Windows (CMD)

```cmd
copy .env.example .env
```

생성된 `.env`를 에디터로 열고 각 값을 채운다.

| 변수                 | 설명                                                                 |
|----------------------|----------------------------------------------------------------------|
| `DATABASE_URL`       | 그대로 둔다 (`file:./dev.db`). 로컬 SQLite 파일                       |
| `ANTHROPIC_API_KEY`  | [Anthropic 콘솔](https://console.anthropic.com)에서 발급. **없으면 비워둬도 OK** — mock 응답으로 자동 폴백 |
| `LLM_MODEL_DEFAULT`  | 잠정 `claude-sonnet-4-7-latest`. 실제 사용 가능 ID는 Anthropic 콘솔에서 확인 |
| `LLM_MODEL_FAST`     | 잠정 `claude-haiku-4-7-latest`                                       |

> `.env`는 `.gitignore` 되어 있어 절대 커밋되지 않는다. 안심하고 본인 키를 넣어도 됨.

### 검증

```bash
# Mac
test -f .env && echo "OK"

# Windows (PowerShell)
Test-Path .env
```

---

## 7. 개발 서버 실행

```bash
pnpm dev
```

터미널에 `Local: http://localhost:3000` 같은 출력이 보이면 브라우저로 접속.

### 검증

- 브라우저 화면이 흰색 깜빡임 없이 로드됨
- 터미널에 에러 스택 없음
- `Ctrl+C`로 서버 종료

---

## 8. 품질 점검 명령

개발을 시작하기 전, 본인 환경에서 다음 명령들이 **모두 통과**하는지 확인한다.

```bash
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm build       # Next.js 프로덕션 빌드
```

각 단계가 `0 errors`로 끝나야 한다. CI에서 도는 것과 동일한 명령이므로 여기서 통과하면 PR도 통과한다.

---

## 9. GitHub CLI (`gh`) 설치 & 인증

PR 생성·머지를 터미널에서 빠르게 처리하기 위해 `gh`를 설치한다.

### 설치

- **macOS**: `brew install gh`
- **Windows**: `winget install GitHub.cli` 또는 [공식 설치파일](https://cli.github.com/)

### 인증

```bash
gh auth login
```

옵션 선택:
1. **What account?** → `GitHub.com`
2. **Preferred protocol?** → `HTTPS`
3. **Authenticate Git with your GitHub credentials?** → `Y`
4. **How would you like to authenticate?** → `Login with a web browser` (권장)
5. 표시되는 8자리 코드를 복사 → Enter → 브라우저에서 코드 붙여넣고 승인

### 검증

```bash
gh auth status   # ✓ Logged in to github.com 라인이 보여야 함
gh repo view dongwandev/d-connect --json visibility,defaultBranchRef
```

---

## 10. 협업 가이드 일독 (필수)

작업 시작 전에 다음 두 문서를 한 번씩 읽는다 — 둘 다 15분 이내 분량.

- 📋 [GITHUB 협업 가이드](GITHUB_GUIDE.md) — Issue/Branch/PR/리뷰/머지 규칙
- 🤖 [CLAUDE.md](../CLAUDE.md) — AI 도구 사용 컨텍스트

특히 다음 두 부분은 **반드시** 기억:

1. **main 직접 push 금지** — 모든 변경은 PR을 거친다.
2. **[위험 작업](GITHUB_GUIDE.md#위험-작업-기준)** — production dependency / DB schema / 인증·인가 / 결제 / 배포·CI 등은 AI 임의 진행 금지, 2명 리뷰 권장.

---

## 11. Claude Code 설치 (선택)

AI 도구로 작업 효율을 높이고 싶다면 Claude Code를 설치한다. **`CLAUDE.md`를 자동 로딩**하므로 별도 세팅 불필요.

### 설치

```bash
npm install -g @anthropic-ai/claude-code
```

> macOS의 일부 환경에서는 `sudo`가 필요할 수 있다. 또는 nvm이 관리하는 Node를 쓰면 sudo 없이 설치 가능.

### 인증

처음 실행 시 브라우저로 Anthropic 계정 인증.

```bash
claude
```

### 첫 사용

```bash
cd ~/GitHub/d-connect
claude
```

세션이 열리면 다음과 같이 작업을 의뢰할 수 있다 (CLAUDE.md의 [AI 작업 지시 예시](../CLAUDE.md) 형식을 따른다):

```
Issue #N을 구현해줘.

규칙:
- feature/N-... 브랜치에서 작업해.
- 먼저 구현 계획을 작성해.
- 기존 코드 스타일을 따라.
- 테스트를 추가해.
- lint, typecheck, test를 실행해.
- 완료 후 Draft PR을 만들어.
```

---

## 12. 첫 작업 시작 체크리스트

다음 모두 ✅인지 확인.

- [ ] `node --version` ≥ 22
- [ ] `pnpm --version` ≥ 11
- [ ] `git config --get user.name` / `user.email` 출력됨
- [ ] `gh auth status` → `Logged in`
- [ ] `pnpm install` 성공
- [ ] `.env` 파일 생성됨
- [ ] `pnpm dev` 실행 후 `http://localhost:3000` 표시 OK
- [ ] `pnpm lint && pnpm typecheck && pnpm build` 모두 통과
- [ ] [GITHUB_GUIDE.md](GITHUB_GUIDE.md) 일독 완료
- [ ] [CLAUDE.md](../CLAUDE.md) 일독 완료

모두 통과했다면 **회의에서 잡은 첫 작업 Issue를 본인에게 assign하고 브랜치를 분기**하면 된다.

---

## 트러블슈팅

### `pnpm` build script 승인 경고

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@..., prisma@..., unrs-resolver@...
```

→ 이미 `pnpm-workspace.yaml`의 `allowBuilds`에 등록되어 있다. 그런데도 경고가 보이면 다음을 실행:

```bash
pnpm install --force
```

### Node 버전 미스매치

`pnpm install` 시 `engine` 관련 경고가 보이면 Node 버전을 확인:

```bash
node --version
```

22 미만이면 §1로 돌아가 nvm으로 22 LTS 설치.

### `.env` 누락 / `ANTHROPIC_API_KEY` 비어있음

→ **정상 동작.** AI 호출 부분이 mock 응답으로 폴백된다(PRD §5.2). 실제 호출이 필요한 단계에서만 키를 채우면 된다.

### Windows에서 줄바꿈 문제

PR diff에서 의도하지 않은 줄바꿈 변경이 보이면:

```bash
git config --global core.autocrlf input
```

이미 잘못 커밋된 경우 팀장에게 문의.

### Windows에서 OneDrive 동기화 폴더 안에 clone

OneDrive가 `node_modules`를 동기화하려다 멈추는 경우가 있다. clone 위치를 OneDrive 바깥(예: `C:\dev\GitHub\`)으로 옮긴다.

### Prisma client가 잡히지 않음 (`Cannot find module '../generated/prisma'`)

```bash
pnpm db:generate
```

### `pnpm dev`가 포트 충돌

기본 3000 포트가 사용 중이면:

```bash
PORT=3001 pnpm dev
```

(Windows PowerShell: `$env:PORT=3001; pnpm dev`)

### 그래도 안 될 때

1. `node_modules`, `.next`, `pnpm-lock.yaml`을 지우고 다시 `pnpm install`
2. 그래도 안 되면 팀 채널에 `pnpm install` / `pnpm dev` 출력 전체를 붙여서 도움 요청

---

## 빠른 참조

- 🏠 [README](../README.md)
- 📋 [PRD](PRD.md)
- 🤝 [GITHUB 협업 가이드](GITHUB_GUIDE.md)
- 🤖 [CLAUDE.md](../CLAUDE.md)
- 🏛️ [ADR-0001 기술 스택](adr/0001-tech-stack.md) · [ADR-0002 LLM Provider](adr/0002-llm-provider.md)

---

## 변경 이력

- 2026-05-26: 초안 작성. Mac/Win 병기, Claude Code 안내 포함.
