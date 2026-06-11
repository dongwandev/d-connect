'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import { formatRelativeTime } from '@/lib/relative-time'

/**
 * 1:1 문의 게시판 (D7 IA — 프로토타입).
 *
 * DB 테이블 추가는 위험 작업이라 발표 단계에서는 localStorage에 저장한다
 * (이 브라우저에서만 보임, 답변 기능은 운영 전환 시 구현).
 * 상단 안내 배너로 프로토타입 한계를 명시한다.
 */

type InquiryType = 'SERVICE' | 'BUG' | 'SUGGESTION' | 'ETC'

interface Inquiry {
  id: string
  type: InquiryType
  title: string
  body: string
  createdAt: string // ISO
  status: 'WAITING'
}

const STORAGE_KEY = 'dconnect.inquiries'

const TYPE_LABEL: Record<InquiryType, string> = {
  SERVICE: '서비스 이용',
  BUG: '오류 신고',
  SUGGESTION: '기능 제안',
  ETC: '기타',
}

const TYPE_BADGE: Record<InquiryType, string> = {
  SERVICE: 'bg-blue-100 text-blue-700',
  BUG: 'bg-red-100 text-red-700',
  SUGGESTION: 'bg-emerald-100 text-emerald-700',
  ETC: 'bg-gray-200 text-gray-700',
}

function loadInquiries(): Inquiry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Inquiry[]) : []
  } catch {
    return []
  }
}

function saveInquiries(items: Inquiry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function InquiryBoard() {
  const toast = useToast()
  const [items, setItems] = useState<Inquiry[]>([])
  const [type, setType] = useState<InquiryType>('SERVICE')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  // localStorage는 클라이언트 전용 — SSR과 첫 렌더를 빈 목록으로 맞춰
  // hydration mismatch를 피하고, microtask에서 채운다 (동기 setState 금지 룰 회피)
  useEffect(() => {
    let alive = true
    Promise.resolve().then(() => {
      if (alive) setItems(loadInquiries())
    })
    return () => {
      alive = false
    }
  }, [])

  function onSubmit(e: React.FormEvent) {
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

    const item: Inquiry = {
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title: t,
      body: b,
      createdAt: new Date().toISOString(),
      status: 'WAITING',
    }
    const next = [item, ...items]
    saveInquiries(next)
    setItems(next)
    setTitle('')
    setBody('')
    setType('SERVICE')
    toast.success('문의가 접수되었습니다', '답변은 준비 중인 기능입니다.')
  }

  function onDelete(id: string) {
    if (!confirm('이 문의를 삭제하시겠습니까?')) return
    const next = items.filter((i) => i.id !== id)
    saveInquiries(next)
    setItems(next)
    toast.success('문의가 삭제되었습니다')
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'

  return (
    <div className="space-y-6">
      {/* 프로토타입 안내 */}
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
        ⚠️ 프로토타입 안내 — 문의는 현재 <strong>이 브라우저에만 저장</strong>
        되며 운영팀 전송·답변 기능은 준비 중입니다.
      </p>

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
              {(Object.keys(TYPE_LABEL) as InquiryType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
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
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            문의 접수
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
                      {TYPE_LABEL[q.type]}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                      {q.title}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                    답변 대기
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {q.body}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(q.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(q.id)}
                    className="rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    삭제
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
