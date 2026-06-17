'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import {
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPE_LABEL,
  type InquiryStatus,
  type InquiryType,
} from '@/lib/enums'
import { formatRelativeTime } from '@/lib/relative-time'

/**
 * 1:1 문의 게시판 (#116 — DB 저장).
 *
 * 목록은 서버 컴포넌트(inquiries/page.tsx)가 내려주고, 작성·삭제는
 * /api/inquiries 호출 후 router.refresh()로 목록을 다시 받는다.
 * 답변 작성 UI는 운영 전환 과제 — 답변은 운영팀이 입력하고 여기서 표시만 한다.
 */

export interface InquiryItem {
  id: string
  type: InquiryType
  title: string
  body: string
  status: InquiryStatus
  answer: string | null
  answeredAt: string | null // ISO
  createdAt: string // ISO
}

const TYPE_BADGE: Record<InquiryType, string> = {
  SERVICE: 'bg-green-100 text-green-700',
  BUG: 'bg-red-100 text-red-700',
  SUGGESTION: 'bg-emerald-100 text-emerald-700',
  ETC: 'bg-gray-200 text-gray-700',
}

const STATUS_BADGE: Record<InquiryStatus, string> = {
  WAITING: 'bg-amber-100 text-amber-700',
  ANSWERED: 'bg-emerald-100 text-emerald-700',
}

/** API 에러 응답에서 사용자 메시지 추출 (zod details 1건 우선) */
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const json: unknown = await res.json()
    const error = (json as { error?: { message?: string; details?: unknown } })
      .error
    if (Array.isArray(error?.details) && error.details.length > 0) {
      const first = error.details[0] as { message?: string }
      if (first.message) return first.message
    }
    if (error?.message) return error.message
  } catch {
    // body가 JSON이 아니면 기본 메시지
  }
  return '요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.'
}

export function InquiryBoard({ items }: { items: InquiryItem[] }) {
  const toast = useToast()
  const router = useRouter()
  const [type, setType] = useState<InquiryType>('SERVICE')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const b = body.trim()
    if (!t) {
      toast.error('제목을 입력해주세요')
      return
    }
    if (!b) {
      toast.error('문의 내용을 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: t, body: b }),
      })
      if (!res.ok) {
        toast.error('문의 접수 실패', await readErrorMessage(res))
        return
      }
      setTitle('')
      setBody('')
      setType('SERVICE')
      toast.success('문의가 접수되었습니다', '답변이 등록되면 이곳에서 확인할 수 있어요.')
      router.refresh()
    } catch {
      toast.error('문의 접수 실패', '네트워크 연결을 확인해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(q: InquiryItem) {
    const warning =
      q.status === 'ANSWERED'
        ? '이 문의를 삭제하시겠습니까? 운영팀 답변도 함께 삭제됩니다.'
        : '이 문의를 삭제하시겠습니까?'
    if (!confirm(warning)) return

    setDeletingId(q.id)
    try {
      const res = await fetch(`/api/inquiries/${q.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('문의 삭제 실패', await readErrorMessage(res))
        return
      }
      toast.success('문의가 삭제되었습니다')
      router.refresh()
    } catch {
      toast.error('문의 삭제 실패', '네트워크 연결을 확인해주세요.')
    } finally {
      setDeletingId(null)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'

  return (
    <div className="space-y-6">
      {/* 작성 폼 */}
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-base font-bold text-gray-900">문의 작성</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              문의 유형
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InquiryType)}
              className={inputCls}
            >
              {(Object.keys(INQUIRY_TYPE_LABEL) as InquiryType[]).map((t) => (
                <option key={t} value={t}>
                  {INQUIRY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              제목
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="문의 제목을 입력해주세요"
              className={inputCls}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            문의 내용
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="문의하실 내용을 자세히 적어주세요. (오류 신고 시 발생 화면·시점을 함께 알려주시면 도움이 됩니다)"
            className={inputCls}
          />
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '접수 중…' : '문의 접수'}
          </button>
        </div>
      </form>

      {/* 내 문의 내역 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">
          내 문의 내역 ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-surface-muted p-8 text-center">
            <p className="text-sm text-gray-600">접수된 문의가 없습니다.</p>
            <p className="mt-1 text-xs text-gray-500">
              위 폼으로 첫 문의를 남겨보세요.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((q) => (
              <li
                key={q.id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_BADGE[q.type]}`}
                    >
                      {INQUIRY_TYPE_LABEL[q.type]}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {q.title}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[q.status]}`}
                  >
                    {INQUIRY_STATUS_LABEL[q.status]}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {q.body}
                </p>

                {q.answer && (
                  <div className="mt-3 rounded-lg border border-accent-500/20 bg-accent-500/5 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent-600">
                        운영팀 답변
                      </span>
                      {q.answeredAt && (
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(q.answeredAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {q.answer}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(q.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(q)}
                    disabled={deletingId === q.id}
                    className="rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === q.id ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
