import { z } from 'zod'

/**
 * 소셜 가입 완료(온보딩) 스키마 — 이메일 회원가입(SignupSchema)과 동일한
 * 추가 정보·동의 항목을 받되, 이메일/비밀번호는 제외 (소셜 인증 완료 상태).
 */

const PHONE_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/

export const OnboardingSchema = z.object({
  /**
   * 소셜 provider가 이메일을 안 주는 경우(카카오) 직접 입력받는다.
   * 이미 이메일이 있는 사용자(구글)는 서버에서 이 값을 무시한다.
   */
  email: z
    .string()
    .email('올바른 이메일 형식이 아닙니다.')
    .max(200, '이메일은 200자 이내로 입력해주세요.')
    .optional(),
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
  agreeTerms: z.boolean().refine((v) => v === true, {
    message: '이용약관에 동의해 주세요.',
  }),
  agreePrivacy: z.boolean().refine((v) => v === true, {
    message: '개인정보 수집·이용에 동의해 주세요.',
  }),
  marketingOptIn: z.boolean().optional(),
})

export type OnboardingInput = z.infer<typeof OnboardingSchema>

/** 이메일이 없는 계정(카카오 가입)용 — 이메일 필수 변형 */
export const OnboardingWithEmailSchema = OnboardingSchema.extend({
  email: z
    .string({ message: '이메일을 입력해주세요.' })
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.')
    .max(200, '이메일은 200자 이내로 입력해주세요.'),
})
