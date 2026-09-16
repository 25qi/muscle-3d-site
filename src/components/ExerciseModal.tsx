import type { NormalizedExercise } from '../lib/providers'
import { muscleTerm } from '../data/muscleTerms'
import { equipmentLabel } from '../data/equipmentZh'
import { useLang, useT, useUiLang } from '../lib/i18n'
import { lazySteps } from '../lib/langSteps'
import { Modal } from './Modal'
import { FavoriteStar } from './FavoriteStar'

interface ExerciseModalProps {
  ex: NormalizedExercise
  favorited: boolean
  onToggleFav: () => void
  onClose: () => void
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
  const equip = (e: string) => equipmentLabel(e, en)

  // 主要顯示語言的步驟(en/zh 內建,其他語言延遲載入)+ 英文步驟對照
  const primarySteps =
    ex.stepsByLang[lang] ?? lazySteps(ex.id, lang) ?? ex.stepsByLang.en ?? []
  const enSteps = ex.stepsByLang.en ?? []
  const showEn = lang !== 'en'

  return (
    <Modal onClose={onClose} row>
        <div className="flex flex-none flex-col items-center justify-center gap-2 bg-ground/60 p-4 md:w-[42%]">
          {ex.gifUrl ? (
            <>
              {/* 授權方 GymVisual 限定 180×180 原始解析度,不放大以維持清晰 */}
              <img
                src={ex.gifUrl}
                alt={ex.name}
                width={180}
                height={180}
                className="h-[180px] w-[180px] rounded-xl object-contain"
              />
              <span className="text-[10px] text-ink-3">
                Exercise images/GIFs © GymVisual
              </span>
            </>
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
              <FavoriteStar
                favorited={favorited}
                onToggle={onToggleFav}
                size="text-2xl"
                className="mt-1"
              />
            </div>
            {!en && (
              <div className="mt-0.5 text-sm text-ink-3 capitalize">
                {ex.name}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
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
    </Modal>
  )
}
