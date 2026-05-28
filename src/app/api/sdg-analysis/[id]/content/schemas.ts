import { z } from 'zod'
import { ContentTypeSchema } from '@/lib/enums'

/**
 * POST /api/sdg-analysis/[id]/content 요청 body.
 * 사양: docs/API.md §5.2 (type만, toneHint는 MVP 범위 외)
 */
export const CreateContentSchema = z.object({
  type: ContentTypeSchema,
})

export type CreateContentInput = z.infer<typeof CreateContentSchema>
