'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  contentId: string
  initial: {
    body: string
    hashtags: string[]
    imagePrompt: string | null
  }
}

type State = { kind: 'idle' } | { kind: 'submitting' }

/**
 * 콘텐츠 편집 폼 (PRD §3.5, API.md §5.3).
 *
 * react-hook-form 없이 단순 useState로 처리 — 필드 3개라 가볍게.
 * hashtags는 쉼표/줄바꿈 구분 입력 → 배열로 변환.
 */
export function ContentEditForm({ contentId, initial }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [body, setBody] = useState(initial.body)
  const [hashtagsText, setHashtagsText] = useState(initial.hashtags.join(', '))
  const [imagePrompt, setImagePrompt] = useState(initial.imagePrompt ?? '')
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ kind: 'submitting' })

    const hashtags = hashtagsText
      .split(/[,\n]/)
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean)

    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          hashtags,
          imagePrompt: imagePrompt.trim() === '' ? null : imagePrompt,
        }),
      })
      const json = (await res.json()) as
        | { data: unknown }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        const message =
          'error' in json
            ? `[${json.error.code}] ${json.error.message}`
            : `HTTP ${res.status}`
        toast.error('저장 실패', message)
        setState({ kind: 'idle' })
        return
      }

      toast.success('저장되었습니다')
      setState({ kind: 'idle' })
      router.refresh()
    } catch (e) {
      toast.error(
        '저장 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
      setState({ kind: 'idle' })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          본문
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          해시태그
        </label>
        <textarea
          value={hashtagsText}
          onChange={(e) => setHashtagsText(e.target.value)}
          rows={2}
          placeholder="쉼표(,) 또는 줄바꿈으로 구분. # 기호는 자동 제거됩니다."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          생성 AI 프롬프트 (선택 — 숏폼·포스터는 외부 생성 AI용 영어 프롬프트)
        </label>
        <textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === 'submitting'}
          className="rounded-full bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
        >
          {state.kind === 'submitting' ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
