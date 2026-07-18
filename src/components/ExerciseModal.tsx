import { useEffect } from 'react'
import type { NormalizedExercise } from '../lib/providers'

interface ExerciseModalProps {
  ex: NormalizedExercise
  favorited: boolean
  onToggleFav: () => void
  onClose: () => void
}

// 器材中文(與 Panel 共用一份會更好,這裡先簡單重用同鍵)
const EQUIP_ZH: Record<string, string> = {
  'body weight': '徒手',
  dumbbell: '啞鈴',
  cable: '滑輪',
  barbell: '槓鈴',
  'leverage machine': '槓桿機',
  band: '彈力帶',
  'smith machine': '史密斯機',
  kettlebell: '壺鈴',
  weighted: '負重',
  'stability ball': '抗力球',
  'ez barbell': 'EZ 槓',
  assisted: '輔助',
  'medicine ball': '藥球',
}
const equipZh = (e: string) => EQUIP_ZH[e] ?? e

/** 全螢幕燈箱:放大的動圖 GIF + 放大的動作說明,背景變暗。 */
export function ExerciseModal({
  ex,
  favorited,
  onToggleFav,
  onClose,
}: ExerciseModalProps) {
  // Esc 關閉 + 鎖背景捲動
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 動圖 GIF */}
        <div className="flex flex-none items-center justify-center bg-ground p-4 md:w-1/2">
          {ex.gifUrl ? (
            <img
              src={ex.gifUrl}
              alt={ex.name}
              className="max-h-[36vh] w-auto rounded-xl object-contain md:max-h-[70vh]"
            />
          ) : (
            <div className="text-ink-3">無示範動圖</div>
          )}
        </div>

        {/* 說明 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {ex.nameZh}
              </h2>
              <div className="mt-0.5 text-sm text-ink-3 capitalize">
                {ex.name}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleFav}
              aria-label={favorited ? '移除最愛' : '加入最愛'}
              className={
                'flex-none px-1 text-2xl leading-none transition-colors ' +
                (favorited ? 'text-warn' : 'text-ink-3 hover:text-warn')
              }
            >
              {favorited ? '★' : '☆'}
            </button>
          </div>

          {/* 訓練肌肉 + 器材 */}
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-md bg-accent/15 px-2 py-0.5 font-medium text-accent">
              {ex.targetMuscle}
            </span>
            {ex.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-md bg-line/60 px-2 py-0.5 text-ink-2"
              >
                {m}
              </span>
            ))}
            {ex.equipment && (
              <span className="rounded-md bg-line/60 px-2 py-0.5 text-ink-2">
                {equipZh(ex.equipment)}
              </span>
            )}
          </div>

          {/* 步驟(中英) */}
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm marker:text-ink-3">
            {ex.steps.map((step, i) => (
              <li key={i}>
                {ex.stepsZh[i] && (
                  <span className="block text-ink">{ex.stepsZh[i]}</span>
                )}
                <span className="mt-0.5 block text-ink-3">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 關閉 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-2/80 text-ink-2 backdrop-blur transition-colors hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
