import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../lib/i18n'

interface ModalProps {
  onClose: () => void
  /** 容器最大寬度(Tailwind class),預設 max-w-3xl */
  maxWidth?: string
  /** 內容水平排列(圖文並排的燈箱用) */
  row?: boolean
  children: ReactNode
}

/**
 * 共用彈窗外框:遮罩、置中容器、右上關閉鈕、Esc 關閉、鎖背景捲動。
 * 用 portal 掛到 body —— 面板有 backdrop-filter,會讓內部 fixed 元素被侷限、裁切。
 */
export function Modal({
  onClose,
  maxWidth = 'max-w-3xl',
  row = false,
  children,
}: ModalProps) {
  const t = useT()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[82vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-2xl backdrop-blur-xl ${
          row ? 'md:flex-row' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  )
}
