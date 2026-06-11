import { z } from 'zod'

/**
 * 비밀번호 재설정 완료 zod 스키마 — 이메일 링크의 토큰 + 새 비밀번호.
 *
 * 본인 확인은 토큰(메일 소유 증명)으로 대체한다 (#88 — 기존 이메일+실명
 * 즉시 재설정 MVP를 교체). 비밀번호 규칙은 회원가입(SignupSchema)과 동일.
 */
export const ResetPasswordSchema = z
  .object({
    token: z
      .string({ message: '재설정 링크가 올바르지 않습니다.' })
      .min(1, '재설정 링크가 올바르지 않습니다.'),
    newPassword: z
      .string({ message: '새 비밀번호를 입력해주세요.' })
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      .max(100, '비밀번호는 100자 이내로 입력해주세요.'),
    newPasswordConfirm: z.string(),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  })

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
