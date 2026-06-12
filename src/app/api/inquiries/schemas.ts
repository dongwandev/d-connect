import { z } from 'zod'
import { InquiryTypeSchema } from '@/lib/enums'

/**
 * POST /api/inquiries 요청 body.
 * 사양: docs/API.md §8.1
 *
 * maxLength는 클라이언트 폼(InquiryBoard)과 일치시킨다 — 제목 100자, 내용 2000자.
 */
export const CreateInquirySchema = z.object({
  type: InquiryTypeSchema,
  title: z
    .string({ message: '제목을 입력해주세요.' })
    .trim()
    .min(1, '제목을 입력해주세요.')
    .max(100, '제목은 100자 이내로 입력해주세요.'),
  body: z
    .string({ message: '문의 내용을 입력해주세요.' })
    .trim()
    .min(1, '문의 내용을 입력해주세요.')
    .max(2000, '문의 내용은 2000자 이내로 입력해주세요.'),
})

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>
