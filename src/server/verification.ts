import 'server-only'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/server/db'
import { isMailerConfigured, sendMail } from '@/server/mailer'

/**
 * 이메일 토큰 — Auth.js 표준 VerificationToken 테이블 재사용.
 *
 * 용도(purpose)별로 identifier를 네임스페이스(`verify:`/`reset:`)로 분리해
 * 가입 인증 토큰으로 비밀번호를 바꾸는 식의 교차 사용을 차단한다.
 * DB에는 sha256 해시만 저장 (DB 유출 시 원본 토큰으로 인증 불가).
 * 이메일·용도당 활성 토큰 1개 — 재발송 시 이전 토큰은 무효화된다.
 */
export type TokenPurpose = 'verify' | 'reset'

/** 비밀번호 재설정은 짧게 — 메일함 탈취 후 뒤늦은 악용 여지를 줄인다 */
const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  verify: 24 * 60 * 60 * 1000,
  reset: 60 * 60 * 1000,
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function identifierOf(purpose: TokenPurpose, email: string): string {
  return `${purpose}:${email}`
}

export async function createVerificationToken(
  email: string,
  purpose: TokenPurpose,
): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const identifier = identifierOf(purpose, email)
  await db.$transaction([
    db.verificationToken.deleteMany({ where: { identifier } }),
    db.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
      },
    }),
  ])
  return token
}

/** 토큰 검증·소비 (일회용). 성공 시 대상 이메일, 실패 시 null. */
export async function consumeVerificationToken(
  token: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const row = await db.verificationToken.findUnique({
    where: { token: hashToken(token) },
  })
  if (!row || !row.identifier.startsWith(`${purpose}:`)) return null

  await db.verificationToken.delete({ where: { token: row.token } })
  if (row.expires.getTime() < Date.now()) return null
  return row.identifier.slice(purpose.length + 1)
}

/** 토큰 유효성만 확인 (소비하지 않음) — 폼 렌더 전 사전 점검용 */
export async function peekVerificationToken(
  token: string,
  purpose: TokenPurpose,
): Promise<boolean> {
  const row = await db.verificationToken.findUnique({
    where: { token: hashToken(token) },
  })
  return (
    row !== null &&
    row.identifier.startsWith(`${purpose}:`) &&
    row.expires.getTime() >= Date.now()
  )
}

/** 재발송 rate limit용 — 마지막 토큰 발급 후 경과 시간(ms). 토큰 없으면 Infinity. */
export async function msSinceLastToken(
  email: string,
  purpose: TokenPurpose,
): Promise<number> {
  const row = await db.verificationToken.findFirst({
    where: { identifier: identifierOf(purpose, email) },
    orderBy: { expires: 'desc' },
  })
  if (!row) return Infinity
  return Date.now() - (row.expires.getTime() - TOKEN_TTL_MS[purpose])
}

export interface SendVerificationResult {
  /** true면 실발송 없이 링크를 직접 반환한 것 (SMTP 미설정/실패 — MVP fallback) */
  mocked: boolean
  /** mocked일 때만 채워짐 — 화면에 표시할 인증 링크 */
  verifyUrl?: string
}

/**
 * ngrok 등 프록시 뒤에서는 Host 헤더가 localhost로 정규화되므로
 * AUTH_URL 명시가 유일하게 신뢰 가능한 origin (docs/OAUTH_SETUP.md)
 */
function baseUrl(): string {
  return (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/** 공용 메일 레이아웃 — 제목/본문/버튼만 갈아 끼운다 */
function mailHtml(opts: {
  title: string
  body: string
  buttonLabel: string
  url: string
}): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#111">${opts.title}</h2>
      <p style="color:#444;line-height:1.6">${opts.body}</p>
      <p style="margin:24px 0">
        <a href="${opts.url}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          ${opts.buttonLabel}
        </a>
      </p>
      <p style="color:#888;font-size:12px;line-height:1.6">
        버튼이 동작하지 않으면 다음 주소를 브라우저에 붙여넣어 주세요:<br/>
        <a href="${opts.url}">${opts.url}</a><br/><br/>
        본인이 요청하지 않았다면 이 메일을 무시해 주세요.
      </p>
    </div>`
}

/**
 * 토큰 링크 메일 발송 공통부. SMTP 미설정 또는 발송 실패 시 mock fallback —
 * 링크를 콘솔에 남기고 호출부에 반환해 화면에 표시하게 한다.
 * (가입·재설정이 메일 인프라 장애로 막히지 않도록 — 시연 안전 우선)
 */
async function sendTokenMail(opts: {
  email: string
  purpose: TokenPurpose
  path: string
  subject: string
  title: string
  body: string
  buttonLabel: string
  validFor: string
}): Promise<SendVerificationResult> {
  const token = await createVerificationToken(opts.email, opts.purpose)
  const url = `${baseUrl()}${opts.path}?token=${token}`

  if (isMailerConfigured()) {
    try {
      await sendMail({
        to: opts.email,
        subject: opts.subject,
        text: `${opts.body} (${opts.validFor} 유효)\n\n${url}\n\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.`,
        html: mailHtml({
          title: opts.title,
          body: `${opts.body} 링크는 ${opts.validFor} 동안 유효합니다.`,
          buttonLabel: opts.buttonLabel,
          url,
        }),
      })
      return { mocked: false }
    } catch (e) {
      console.error(`[mail] ${opts.purpose} 메일 발송 실패 — mock fallback:`, e)
    }
  }

  console.log(`[mail][mock] ${opts.email} ${opts.purpose} 링크: ${url}`)
  return { mocked: true, verifyUrl: url }
}

export function sendVerificationEmail(
  email: string,
): Promise<SendVerificationResult> {
  return sendTokenMail({
    email,
    purpose: 'verify',
    path: '/verify-email',
    subject: '[D-Connect] 이메일 인증을 완료해 주세요',
    title: 'D-Connect 이메일 인증',
    body: '아래 버튼을 눌러 이메일 인증을 완료해 주세요.',
    buttonLabel: '이메일 인증하기',
    validFor: '24시간',
  })
}

export function sendPasswordResetEmail(
  email: string,
): Promise<SendVerificationResult> {
  return sendTokenMail({
    email,
    purpose: 'reset',
    path: '/reset-password',
    subject: '[D-Connect] 비밀번호 재설정 안내',
    title: 'D-Connect 비밀번호 재설정',
    body: '아래 버튼을 눌러 새 비밀번호를 설정해 주세요.',
    buttonLabel: '비밀번호 재설정하기',
    validFor: '1시간',
  })
}

/**
 * 비밀번호가 없는 간편 로그인 계정의 재설정 요청 안내 메일.
 * (요청 응답은 generic이라 화면에서 알려줄 수 없으므로 메일로 안내)
 */
export async function sendSocialOnlyNoticeEmail(
  email: string,
  providerLabels: string[],
): Promise<SendVerificationResult> {
  const url = `${baseUrl()}/login`
  const methods =
    providerLabels.length > 0 ? providerLabels.join('·') : '간편 로그인'

  if (isMailerConfigured()) {
    try {
      await sendMail({
        to: email,
        subject: '[D-Connect] 이 계정은 간편 로그인 계정입니다',
        text: `이 계정은 비밀번호가 설정되지 않은 간편 로그인 계정입니다. ${methods}(으)로 로그인해 주세요.\n\n${url}\n\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.`,
        html: mailHtml({
          title: '비밀번호가 없는 계정입니다',
          body: `이 계정은 ${methods}(으)로 가입되어 비밀번호가 설정되어 있지 않습니다. 간편 로그인으로 이용해 주세요.`,
          buttonLabel: '로그인하러 가기',
          url,
        }),
      })
      return { mocked: false }
    } catch (e) {
      console.error('[mail] 간편 로그인 안내 메일 발송 실패 — mock fallback:', e)
    }
  }

  console.log(`[mail][mock] ${email} 간편 로그인(${methods}) 계정 안내`)
  return { mocked: true }
}
