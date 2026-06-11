import { z } from 'zod'

/**
 * 비밀번호 재설정 zod 스키마 (MVP — 본인 확인 후 즉시 재설정).
 *
 * 운영 단계에서는 이메일 인증 링크(토큰) 방식으로 교체 예정.
 * 비밀번호 규칙은 회원가입(SignupSchema)과 동일하게 유지한다.
 */
export const ResetPasswordSchema = z
  .object({
    email: z
      .string({ message: '이메일을 입력해주세요.' })
      .min(1, '이메일을 입력해주세요.')
      .email('올바른 이메일 형식이 아닙니다.')
      .max(200, '이메일은 200자 이내로 입력해주세요.'),
    realName: z
      .string({ message: '실명을 입력해주세요.' })
      .min(1, '실명을 입력해주세요.')
      .max(50, '실명은 50자 이내로 입력해주세요.'),
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
