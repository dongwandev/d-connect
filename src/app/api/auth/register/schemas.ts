import { z } from 'zod'

/**
 * 회원가입 / 로그인 zod 스키마.
 *
 * 메시지는 모두 한글, 사용자에게 그대로 노출.
 */

// 010-xxxx-xxxx 또는 0xx-xxxx-xxxx 형식 (선택 항목이라 빈 문자열 허용 후 변환)
const PHONE_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/

export const SignupSchema = z
  .object({
    email: z
      .string({ message: '이메일을 입력해주세요.' })
      .min(1, '이메일을 입력해주세요.')
      .email('올바른 이메일 형식이 아닙니다.')
      .max(200, '이메일은 200자 이내로 입력해주세요.'),
    password: z
      .string({ message: '비밀번호를 입력해주세요.' })
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      .max(100, '비밀번호는 100자 이내로 입력해주세요.'),
    passwordConfirm: z.string(),
    realName: z
      .string({ message: '실명을 입력해주세요.' })
      .min(1, '실명을 입력해주세요.')
      .max(50, '실명은 50자 이내로 입력해주세요.'),
    displayName: z
      .string()
      .max(30, '표시명은 30자 이내로 입력해주세요.')
      .optional(),
    phone: z
      .string()
      .optional()
      .refine(
        (v) => !v || PHONE_PATTERN.test(v),
        '010-1234-5678 형식으로 입력해주세요.',
      ),
    organization: z
      .string()
      .max(100, '소속은 100자 이내로 입력해주세요.')
      .optional(),
    agreeTerms: z
      .boolean()
      .refine((v) => v === true, {
        message: '이용약관에 동의해 주세요.',
      }),
    agreePrivacy: z
      .boolean()
      .refine((v) => v === true, {
        message: '개인정보 처리방침에 동의해 주세요.',
      }),
    marketingOptIn: z.boolean(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  })

export type SignupInput = z.infer<typeof SignupSchema>

export const LoginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof LoginSchema>
