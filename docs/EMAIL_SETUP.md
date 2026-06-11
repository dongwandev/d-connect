# 이메일 인증 발송 설정 (Gmail SMTP)

> 가입 시 이메일 인증 링크를 발송하기 위한 SMTP 설정 가이드 (#86).
> **설정하지 않아도 동작한다** — 미설정 시 mock fallback으로 인증 링크가
> 화면 배너와 dev 콘솔에 직접 표시된다 (AI mock fallback과 동일 정책, PRD §5.2).

## 1. Gmail 앱 비밀번호 발급

일반 비밀번호로는 SMTP 로그인이 불가 — **앱 비밀번호**가 필요하다.

1. 발송용 Google 계정에 **2단계 인증**을 켠다: https://myaccount.google.com/security
2. 앱 비밀번호 생성: https://myaccount.google.com/apppasswords
   - 앱 이름: `d-connect` 등 자유 입력 → **만들기**
3. 표시되는 16자리 비밀번호를 복사 (공백 제거, 이 화면을 닫으면 다시 볼 수 없음)

## 2. .env 설정

```bash
# @ 는 %40 으로 URL 인코딩. 앱 비밀번호는 공백 없이 16자리.
EMAIL_SERVER="smtps://you%40gmail.com:abcdabcdabcdabcd@smtp.gmail.com:465"
EMAIL_FROM="D-Connect <you@gmail.com>"
```

설정 후 dev 서버 재시작.

## 3. 동작 확인

1. 새 계정으로 회원가입 → 입력한 이메일로 `[D-Connect] 이메일 인증을 완료해 주세요` 메일 도착
2. 메일의 버튼/링크 클릭 → `/verify-email` 인증 완료 페이지
3. 미인증 상태에서는 로그인 후 상단에 노란 배너 표시 — **인증 메일 재발송** 버튼 (1분 쿨다운)

## 운영 메모

- **발송 한도**: Gmail 무료 계정 일 ~500통 — 시연 규모에 충분
- **스팸함**: Gmail 발신 특성상 수신자 스팸함으로 갈 수 있음 — 시연 안내 시 "스팸함도 확인" 멘트 권장
- **ngrok 시연**: 인증 링크의 origin은 `AUTH_URL`을 따른다 — ngrok으로 시연할 때는
  `AUTH_URL`이 ngrok 도메인으로 설정돼 있어야 참가자 휴대폰에서 링크가 열린다
  (로컬 전용이면 링크가 `http://localhost:3000`이라 발표 PC에서만 열림)
- **토큰**: 24시간 유효, 일회용, 재발송 시 이전 링크 무효화. DB에는 sha256 해시만 저장
- **운영 단계 과제**: 도메인 보유 시 Resend 등 전용 발송 서비스로 교체 (ADR-0004),
  미인증 계정 기능 제한 정책 검토
