import 'server-only'
import nodemailer from 'nodemailer'

/**
 * SMTP 메일 발송 헬퍼.
 *
 * EMAIL_SERVER(smtp URL) + EMAIL_FROM 설정 시에만 동작 — 미설정이면
 * 호출부에서 mock fallback(링크 화면·콘솔 표시)으로 분기한다 (PRD §5.2
 * AI mock fallback과 동일 정책). 셋업 가이드: docs/EMAIL_SETUP.md
 */
const SEND_TIMEOUT_MS = 10_000

export function isMailerConfigured(): boolean {
  return Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM)
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const server = process.env.EMAIL_SERVER
  const from = process.env.EMAIL_FROM
  if (!server || !from) {
    throw new Error('EMAIL_SERVER / EMAIL_FROM 미설정')
  }

  // 요청마다 transporter 생성 — 시연 트래픽 수준에서 커넥션 풀 불필요
  const transporter = nodemailer.createTransport(server)
  try {
    await Promise.race([
      transporter.sendMail({ from, ...opts }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`메일 발송 ${SEND_TIMEOUT_MS}ms 타임아웃`)),
          SEND_TIMEOUT_MS,
        ),
      ),
    ])
  } finally {
    transporter.close()
  }
}
