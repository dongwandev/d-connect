# 소셜 로그인 (카카오 · 구글) 설정 가이드

> 코드는 이미 준비되어 있다 — `.env`에 키 4개를 넣으면 로그인 페이지에 버튼이 자동으로 나타난다.
> 이 문서는 **OAuth 앱 등록 → 키 발급 → .env 입력**까지의 절차를 다룬다. (소요 약 15~20분)
> 콘솔 메뉴 경로는 **2026-06 기준 최신 UI**로 작성 (카카오 2025년 콘솔 개편 / 구글 Google Auth Platform 반영).

---

## 0. 동작 방식 요약

| 구성 | 내용 |
|---|---|
| 코드 | [`src/auth.ts`](../src/auth.ts) — NextAuth v5 Kakao/Google provider. **env 키가 있을 때만 등록** |
| UI | 로그인 페이지 — 활성 provider만 버튼 노출 (`enabledProviders()`) |
| 콜백 경로 | `/api/auth/callback/kakao` · `/api/auth/callback/google` (NextAuth 표준) |
| 계정 생성 | 첫 소셜 로그인 시 User + Account 자동 생성 (PrismaAdapter), 세션은 JWT |

### 필요한 키 4개

```bash
KAKAO_CLIENT_ID=""       # 카카오 'REST API 키'
KAKAO_CLIENT_SECRET=""   # REST API 키의 '클라이언트 시크릿'
GOOGLE_CLIENT_ID=""      # Google OAuth '클라이언트 ID'
GOOGLE_CLIENT_SECRET=""  # Google OAuth '클라이언트 보안 비밀번호'
```

---

## 1. 카카오 (Kakao Developers)

1. **<https://developers.kakao.com>** 접속 → 카카오 계정 로그인
2. 상단 **내 애플리케이션** → **애플리케이션 추가하기**
   - 앱 이름: `D-Connect` / 회사명: 팀명 아무거나 / 카테고리: 적절히 선택
3. **[앱] > [플랫폼 키]** 에서 **REST API 키** 확인·복사
   → 이것이 `KAKAO_CLIENT_ID` (⚠️ JavaScript 키 아님 — NextAuth는 서버사이드 REST 방식)
4. 같은 화면에서 **REST API 키 클릭 → [클라이언트 시크릿]**:
   - 신규 키는 기본 활성화 상태 — 시크릿 코드를 복사 → `KAKAO_CLIENT_SECRET`
   - 비활성 상태라면 **[활성화]** ON 후 [저장]
5. **REST API 키 화면의 [리다이렉트 URI]** 에 등록 (키당 최대 10개):
   ```
   http://localhost:3000/api/auth/callback/kakao
   ```
   (ngrok으로 외부 테스트하려면 `https://<ngrok도메인>/api/auth/callback/kakao` 도 추가)
6. **[카카오 로그인] > [사용 설정]** → **[상태]** ON
7. **[카카오 로그인] > [동의항목]**:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 선택 동의 (권장)
   - **카카오계정(이메일)**: **선택 동의** — ⚠️ 비즈 앱 전환(비즈니스 인증) 전에는 '필수 동의' 불가.
     이메일 동의를 안 하면 가입은 되지만 이메일 없이 생성된다 (아래 §3 계정 충돌 참고)

> 기본 동의항목만 쓰는 카카오 로그인은 **별도 심사 없이 즉시 테스트 가능**하며, 팀원이 아닌 일반 카카오 계정도 로그인할 수 있다. 팀원 권한 추가는 **[앱] > [멤버]** 에서 카카오계정(이메일)으로 초대.

## 2. 구글 (Google Cloud Console)

1. **<https://console.cloud.google.com>** 접속 → 프로젝트 선택 또는 **새 프로젝트** (예: `d-connect`)
2. 메뉴 → **Google Auth Platform** (처음이면 'Get Started' 마법사):
   - **브랜딩(Branding)**: 앱 이름 `D-Connect`, 사용자 지원 이메일 입력
   - **대상(Audience)**: **외부(External)** 선택
   - 연락처 정보 입력 → 정책 동의 → 만들기
   - **대상(Audience) 화면의 테스트 사용자**: 게시 전 상태에서는 등록된 테스트 사용자만 로그인 가능
     → **팀원·시연 계정의 구글 이메일을 모두 추가** ⚠️ 가장 자주 빠뜨리는 단계
   - (범위(Scope)는 기본값 그대로 — email/profile/openid는 비민감이라 추가 설정 불필요)
3. **Google Auth Platform > 클라이언트(Clients)** → **+ 클라이언트 만들기**:
   - 애플리케이션 유형: **웹 애플리케이션** / 이름: `d-connect-web`
   - **승인된 리디렉션 URI**:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
     (ngrok 테스트 시 `https://<ngrok도메인>/api/auth/callback/google` 추가)
   - '승인된 자바스크립트 원본'은 **불필요** (NextAuth는 서버사이드 code flow — 등록해도 무해)
4. 생성 완료 팝업의 **클라이언트 ID** → `GOOGLE_CLIENT_ID`, **클라이언트 보안 비밀번호** → `GOOGLE_CLIENT_SECRET`

> 구 메뉴 'API 및 서비스 > OAuth 동의 화면 / 사용자 인증 정보' 경로로 들어가도 새 화면으로 연결된다.

## 3. `.env` 입력 + 재시작

```bash
# .env (gitignored — 절대 커밋 금지)
KAKAO_CLIENT_ID="발급받은 REST API 키"
KAKAO_CLIENT_SECRET="발급받은 클라이언트 시크릿"
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

```bash
# dev 서버 재시작 (env는 핫리로드 안 됨)
pnpm dev
```

→ 로그인 페이지에 **"카카오로 시작하기" / "Google로 시작하기"** 버튼이 나타나면 성공.

### ⚠️ 같은 이메일 계정 충돌 (OAuthAccountNotLinked)

이미 **이메일·비밀번호로 가입한 주소**와 같은 이메일의 구글 계정으로 로그인하면, 보안상 자동 연결하지 않고 로그인 페이지로 돌려보낸다 (빨간 안내 배너 표시). 이 경우 처음 가입했던 방법으로 로그인해야 한다. 계정 자동 연결은 보안 트레이드오프가 있어 프로토타입에서는 비활성 유지.

### 시연 체크리스트

- [ ] 카카오 로그인 → 동의 화면 → 대시보드 진입
- [ ] 구글 로그인 (테스트 사용자로 등록된 계정) → 대시보드 진입
- [ ] 소셜 첫 로그인 후 마이페이지에 프로필 표시 확인
- [ ] 로그아웃 → 재로그인 정상
- [ ] (ngrok 시연 시) ngrok 도메인 Redirect URI가 양쪽 콘솔에 등록되어 있는지 — **무료 ngrok은 재시작마다 도메인이 바뀌므로 시연 직전 확인 필수**

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| 버튼이 안 보임 | `.env` 키 누락 또는 dev 서버 재시작 안 함 |
| 카카오 `KOE006` | Redirect URI 미등록/오타 — [플랫폼 키] > [REST API 키] > [리다이렉트 URI]와 정확히 일치해야 함 |
| 카카오 `KOE010` | Client Secret 불일치 — [플랫폼 키] > [REST API 키] > [클라이언트 시크릿] 활성화 상태·값 확인 |
| 구글 `redirect_uri_mismatch` | 리디렉션 URI 미등록/오타 (http vs https, 끝 슬래시 주의) |
| 구글 화면에서 `access_denied` (403) | OAuth 동의 화면(대상)의 테스트 사용자에 해당 구글 계정 미등록. 앱으로 돌아오면 `/login`에 안내 배너 표시(OAuthCallbackError) |
| 로그인 후 빨간 배너 | §3의 OAuthAccountNotLinked — 기존 가입 방법으로 로그인 |
