import 'server-only'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/server/db'
import { isMailerConfigured, sendMail } from '@/server/mailer'

/**
 * 이메일 인증 토큰 — Auth.js 표준 VerificationToken 테이블 재사용.
 *
 * DB에는 sha256 해시만 저장 (DB 유출 시 원본 토큰으로 인증 불가).
 * 이메일당 활성 토큰 1개 — 재발송 시 이전 토큰은 무효화된다.
 */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await db.$transaction([
    db.verificationToken.deleteMany({ where: { identifier: email } }),
    db.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ])
  return token
}

/** 토큰 검증·소비 (일회용). 성공 시 대상 이메일, 실패 시 null. */
export async function consumeVerificationToken(
  token: string,
): Promise<string | null> {
  const row = await db.verificationToken.findUnique({
    where: { token: hashToken(token) },
  })
  if (!row) return null

  await db.verificationToken.delete({ where: { token: row.token } })
  if (row.expires.getTime() < Date.now()) return null
  return row.identifier
}

/** 재발송 rate limit용 — 마지막 토큰 발급 후 경과 시간(ms). 토큰 없으면 Infinity. */
export async function msSinceLastToken(email: string): Promise<number> {
  const row = await db.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: 'desc' },
  })
  if (!row) return Infinity
  return Date.now() - (row.expires.getTime() - TOKEN_TTL_MS)
}

export interface SendVerificationResult {
  /** true면 실발송 없이 링크를 직접 반환한 것 (SMTP 미설정/실패 — MVP fallback) */
  mocked: boolean
  /** mocked일 때만 채워짐 — 화면에 표시할 인증 링크 */
  verifyUrl?: string
}

/**
 * 인증 메일 발송. SMTP 미설정 또는 발송 실패 시 mock fallback —
 * 인증 링크를 콘솔에 남기고 호출부에 반환해 화면에 표시하게 한다.
 * (가입·재발송이 메일 인프라 장애로 막히지 않도록 — 시연 안전 우선)
 */
export async function sendVerificationEmail(
  email: string,
): Promise<SendVerificationResult> {
  const token = await createVerificationToken(email)
  // ngrok 등 프록시 뒤에서는 Host 헤더가 localhost로 정규화되므로
  // AUTH_URL 명시가 유일하게 신뢰 가능한 origin (docs/OAUTH_SETUP.md)
  const base = (process.env.AUTH_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  const verifyUrl = `${base}/verify-email?token=${token}`

  if (isMailerConfigured()) {
    try {
      await sendMail({
        to: email,
        subject: '[D-Connect] 이메일 인증을 완료해 주세요',
        text: `아래 링크를 열어 이메일 인증을 완료해 주세요 (24시간 유효):\n\n${verifyUrl}\n\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111">D-Connect 이메일 인증</h2>
            <p style="color:#444;line-height:1.6">
              아래 버튼을 눌러 이메일 인증을 완료해 주세요. 링크는 24시간 동안 유효합니다.
            </p>
            <p style="margin:24px 0">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
                이메일 인증하기
              </a>
            </p>
            <p style="color:#888;font-size:12px;line-height:1.6">
              버튼이 동작하지 않으면 다음 주소를 브라우저에 붙여넣어 주세요:<br/>
              <a href="${verifyUrl}">${verifyUrl}</a><br/><br/>
              본인이 요청하지 않았다면 이 메일을 무시해 주세요.
            </p>
          </div>`,
      })
      return { mocked: false }
    } catch (e) {
      console.error('[mail] 인증 메일 발송 실패 — mock fallback:', e)
    }
  }

  console.log(`[mail][mock] ${email} 인증 링크: ${verifyUrl}`)
  return { mocked: true, verifyUrl }
}
