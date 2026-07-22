import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { NormalizedExercise } from '../lib/providers'
import { muscleTerm } from '../data/muscleTerms'
import { useLang, useT, useUiLang } from '../lib/i18n'
import { lazySteps } from '../lib/langSteps'

interface ExerciseModalProps {
  ex: NormalizedExercise
  favorited: boolean
  onToggleFav: () => void
  onClose: () => void
}

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

/** 全螢幕燈箱:放大的動圖 GIF + 放大的動作說明(依語言),背景變暗。 */
export function ExerciseModal({
  ex,
  favorited,
  onToggleFav,
  onClose,
}: ExerciseModalProps) {
  const { lang } = useLang()
  const t = useT()
  const en = useUiLang() === 'en'
  const term = (m: string) => muscleTerm(m, lang)
  const equip = (e: string) => (en ? e : (EQUIP_ZH[e] ?? e))

  // 主要顯示語言的步驟(en/zh 內建,其他語言延遲載入)+ 英文步驟對照
  const primarySteps =
    ex.stepsByLang[lang] ?? lazySteps(ex.id, lang) ?? ex.stepsByLang.en ?? []
  const enSteps = ex.stepsByLang.en ?? []
  const showEn = lang !== 'en'

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

  // 用 portal 掛到 body:面板有 backdrop-filter,會讓內部的 fixed 元素被侷限、裁切
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-2xl backdrop-blur-xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-center bg-ground/60 p-4 md:w-[42%]">
          {ex.gifUrl ? (
            <img
              src={ex.gifUrl}
              alt={ex.name}
              className="max-h-[30vh] w-auto rounded-xl object-contain md:max-h-[60vh]"
            />
          ) : (
            <div className="text-ink-3">{t('noGif')}</div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          {/* 星號緊跟在標題旁,避免與右上角關閉鈕重疊 */}
          <div className="pr-12">
            {/* items-start + 微調偏移:標題換行時星號仍對齊第一行 */}
            <div className="flex items-start gap-2">
              <h2 className="min-w-0 text-2xl font-semibold tracking-tight text-ink capitalize">
                {en ? ex.name : ex.nameZh}
              </h2>
              <button
                type="button"
                onClick={onToggleFav}
                aria-label={favorited ? t('removeFav') : t('addFav')}
                className={
                  'mt-1 flex-none text-2xl leading-none transition-colors ' +
                  (favorited ? 'text-accent' : 'text-ink-3 hover:text-accent')
                }
              >
                {favorited ? '★' : '☆'}
              </button>
            </div>
            {!en && (
              <div className="mt-0.5 text-sm text-ink-3 capitalize">
                {ex.name}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-md bg-accent/15 px-2 py-0.5 font-medium text-accent">
              {term(ex.targetMuscle)}
            </span>
            {ex.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-md bg-line/60 px-2 py-0.5 text-ink-2"
              >
                {term(m)}
              </span>
            ))}
            {ex.equipment && (
              <span className="rounded-md bg-line/60 px-2 py-0.5 text-ink-2">
                {equip(ex.equipment)}
              </span>
            )}
          </div>

          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm marker:text-ink-3">
            {primarySteps.map((step, i) => (
              <li key={i}>
                <span className="block text-ink">{step}</span>
                {showEn && enSteps[i] && (
                  <span className="mt-0.5 block text-ink-3">{enSteps[i]}</span>
                )}
              </li>
            ))}
          </ol>
        </div>

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
