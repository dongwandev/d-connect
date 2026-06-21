import { z } from 'zod'
import {
  AspectRatioSchema,
  BodyLengthSchema,
  CardDensitySchema,
  ImageStyleSchema,
  PostToneSchema,
  PosterTextAmountSchema,
  PosterUsageSchema,
  SCENE_COUNT_RANGE,
  SdgGoalSchema,
  SnsPlatformSchema,
  VIDEO_DURATION_RANGE,
  VideoMoodSchema,
} from '@/lib/enums'

/**
 * POST /api/sdg-analysis/[id]/content 요청 body (#92, #104, #123).
 *
 * 콘텐츠 유형별로 세부 설정이 다르므로 `type` 기준 discriminated union으로 검증한다.
 * 공유 필드(focusSdg)는 base에서 합성하고, 유형별 특화 필드만 각 멤버가 가진다.
 * 멤버는 순수 object로 유지하고(zod discriminatedUnion 안전), 교차 필드 검증
 * (SNS_POST: withImage → 비율/스타일)은 union 최상위 superRefine에서 처리한다.
 */
const base = z.object({ focusSdg: SdgGoalSchema })

const extraRequest = z
  .string()
  .max(200, '추가 요청은 200자 이내로 입력해주세요.')
  .optional()

const SCENE_MIN = SCENE_COUNT_RANGE[0]
const SCENE_MAX = SCENE_COUNT_RANGE[SCENE_COUNT_RANGE.length - 1]

const snsPostSchema = base.extend({
  type: z.literal('SNS_POST'),
  platform: SnsPlatformSchema,
  bodyLength: BodyLengthSchema,
  tone: PostToneSchema,
  withImage: z.boolean(),
  // withImage=true일 때만 의미. 조건부 필수는 최상위 superRefine에서 검증.
  aspectRatio: AspectRatioSchema.optional(),
  imageStyle: ImageStyleSchema.optional(),
  extraRequest,
})

const cardNewsSchema = base.extend({
  type: z.literal('CARD_NEWS'),
  aspectRatio: AspectRatioSchema,
  imageStyle: ImageStyleSchema,
  slideCount: z
    .number()
    .int()
    .min(3, '카드 수는 3~8장 사이로 선택해주세요.')
    .max(8, '카드 수는 3~8장 사이로 선택해주세요.'),
  density: CardDensitySchema,
  closingCard: z.boolean(),
  extraRequest,
})

const shortVideoSchema = base.extend({
  type: z.literal('SHORT_VIDEO_SCRIPT'),
  platform: SnsPlatformSchema,
  aspectRatio: AspectRatioSchema,
  imageStyle: ImageStyleSchema,
  videoDuration: z
    .number()
    .int()
    .refine(
      (n) => (VIDEO_DURATION_RANGE as readonly number[]).includes(n),
      '영상 길이는 15·30·60초 중에서 선택해주세요.',
    ),
  sceneCount: z
    .number()
    .int()
    .min(SCENE_MIN, `씬 수는 ${SCENE_MIN}~${SCENE_MAX}개 사이로 선택해주세요.`)
    .max(SCENE_MAX, `씬 수는 ${SCENE_MIN}~${SCENE_MAX}개 사이로 선택해주세요.`),
  subtitles: z.boolean(),
  mood: VideoMoodSchema,
  extraRequest,
})

const posterSchema = base.extend({
  type: z.literal('POSTER'),
  aspectRatio: AspectRatioSchema,
  imageStyle: ImageStyleSchema,
  usage: PosterUsageSchema,
  textAmount: PosterTextAmountSchema,
  extraRequest,
})

export const CreateContentSchema = z
  .discriminatedUnion('type', [
    snsPostSchema,
    cardNewsSchema,
    shortVideoSchema,
    posterSchema,
  ])
  .superRefine((v, ctx) => {
    if (v.type === 'SNS_POST' && v.withImage) {
      if (!v.aspectRatio) {
        ctx.addIssue({
          code: 'custom',
          path: ['aspectRatio'],
          message: '이미지를 곁들이려면 비율을 선택해주세요.',
        })
      }
      if (!v.imageStyle) {
        ctx.addIssue({
          code: 'custom',
          path: ['imageStyle'],
          message: '이미지를 곁들이려면 이미지 스타일을 선택해주세요.',
        })
      }
    }
  })

export type CreateContentInput = z.infer<typeof CreateContentSchema>
