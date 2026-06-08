'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * 자체 구현 Toast 시스템 — 라이브러리 추가 없이 한 파일에 Provider + hook + 렌더링.
 *
 * 사용:
 *   const t = useToast()
 *   t.success('저장되었습니다')
 *   t.error('저장 실패', '서버 응답 오류')
 *
 * 마운트: root layout에 <ToastProvider>로 감싼다.
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  title: string
  description?: string
}

interface ToastApi {
  toast: (input: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>')
  }
  return ctx
}

const AUTO_DISMISS_MS = 4000

const VARIANT_STYLE: Record<
  ToastVariant,
  { container: string; text: string; icon: string }
> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-900',
    icon: '✅',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    text: 'text-red-900',
    icon: '⚠️',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    text: 'text-amber-900',
    icon: '⚠️',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    text: 'text-blue-900',
    icon: 'ℹ️',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  // 컴포넌트 unmount 시 stale setState 방지 — Provider는 root이라 사실상 안 일어나지만 안전망
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const dismiss = useCallback((id: number) => {
    if (!mountedRef.current) return
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (input: Omit<ToastItem, 'id'>) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { ...input, id }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const api: ToastApi = {
    toast: push,
    success: (title, description) =>
      push({ variant: 'success', title, description }),
    error: (title, description) =>
      push({ variant: 'error', title, description }),
    warning: (title, description) =>
      push({ variant: 'warning', title, description }),
    info: (title, description) =>
      push({ variant: 'info', title, description }),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-sm flex-col gap-2 px-4 sm:right-4 sm:left-auto sm:inset-auto sm:top-4 sm:px-0"
        aria-live="polite"
        role="region"
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLE[t.variant]
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${style.container} ${style.text} p-3 shadow-md`}
            >
              <span aria-hidden className="shrink-0 text-base leading-5">
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-snug opacity-80">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="ml-1 text-xs opacity-60 transition-opacity hover:opacity-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
