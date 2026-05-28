import { z } from 'zod'

const PHONE_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/

/**
 * PATCH /api/auth/user — 본인 프로필 수정.
 *
 * 모든 필드 optional, 한 가지 이상 제공 필수.
 * email/password 변경은 별도 흐름 (후속).
 */
export const UpdateUserSchema = z
  .object({
    name: z
      .string()
      .max(30, '표시명은 30자 이내로 입력해주세요.')
      .optional(),
    realName: z
      .string()
      .min(1, '실명을 입력해주세요.')
      .max(50, '실명은 50자 이내로 입력해주세요.')
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
    marketingOptIn: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.realName !== undefined ||
      v.phone !== undefined ||
      v.organization !== undefined ||
      v.marketingOptIn !== undefined,
    { message: '하나 이상의 필드가 필요합니다.' },
  )

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
