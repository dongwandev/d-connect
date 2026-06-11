import { z } from 'zod'

/** 비밀번호 재설정 링크 요청 zod 스키마. */
export const ForgotPasswordSchema = z.object({
  email: z
    .string({ message: '이메일을 입력해주세요.' })
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.')
    .max(200, '이메일은 200자 이내로 입력해주세요.'),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

/** 응답 — 계정 존재 여부를 노출하지 않는 generic 형태. mock 필드는 SMTP 미설정 시에만. */
export interface ForgotPasswordResult {
  sent: true
  /** SMTP 미설정/실패 — dev 환경에서 링크를 화면에 직접 표시 */
  mocked?: boolean
  /** mocked + 재설정 가능 계정일 때만 — 재설정 링크 */
  verifyUrl?: string
  /** mocked + 간편 로그인 전용 계정일 때만 — provider 한글 라벨 */
  socialOnly?: string[]
}
