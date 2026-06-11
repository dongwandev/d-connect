import { z } from 'zod'

/**
 * 이메일(아이디) 찾기 zod 스키마.
 *
 * 실명 + 연락처로 본인 계정을 조회한다. 연락처는 가입과 달리 필수 —
 * 연락처 없이 실명만으로는 타인 계정 추측이 너무 쉬워진다.
 */
const PHONE_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/

export const FindEmailSchema = z.object({
  realName: z
    .string({ message: '실명을 입력해주세요.' })
    .min(1, '실명을 입력해주세요.')
    .max(50, '실명은 50자 이내로 입력해주세요.'),
  phone: z
    .string({ message: '연락처를 입력해주세요.' })
    .min(1, '연락처를 입력해주세요.')
    .refine(
      (v) => PHONE_PATTERN.test(v),
      '010-1234-5678 형식으로 입력해주세요.',
    ),
})

export type FindEmailInput = z.infer<typeof FindEmailSchema>

/** 응답의 matches 항목 — 클라이언트 안내 문구 구성용 */
export interface FindEmailMatch {
  maskedEmail: string
  hasPassword: boolean
  providers: string[]
}
