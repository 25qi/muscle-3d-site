import { useState } from 'react'
import { createPortal } from 'react-dom'
import { LANGS, useLang, useT } from '../lib/i18n'
import { MuscleList } from './MuscleList'
import { IconChat, IconInfo, IconLanguages, IconStar } from './icons'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  /** 收藏總數(動作 + 肌肉),顯示在「我的最愛」旁 */
  favCount: number
  onOpenFavorites: () => void
  onFeedback: () => void
  onAbout: () => void
  selectedName: string | null
  onSelectMuscle: (name: string) => void
}

/**
 * 手機側邊選單:把桌機版頂部工具列 + 左側肌肉清單收在一起,從左側滑出。
 * 桌機(md 以上)不使用此元件,仍走原本的工具列與左側浮層。
 */
export function MobileMenu({
  open,
  onClose,
  favCount,
  onOpenFavorites,
  onFeedback,
  onAbout,
  selectedName,
  onSelectMuscle,
}: MobileMenuProps) {
  const t = useT()
  const { lang, setLang } = useLang()
  const [langOpen, setLangOpen] = useState(false)

  const row =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 active:bg-surface-2'

  return createPortal(
    <div
      className={`fixed inset-0 z-[55] md:hidden ${
        open ? '' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      {/* 遮罩:點一下關閉 */}
      <div
        className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 抽屜本體:從左側滑入 */}
      <aside
        className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-surface/95 text-ink shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 抽屜標題列 */}
        <div className="flex items-center gap-2 border-b border-line p-3">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="text-base font-semibold tracking-tight text-ink">
            Vector
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="ml-auto rounded-lg px-2 py-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {/* 控制群(取代頂部工具列) */}
        <div className="flex flex-col gap-0.5 border-b border-line p-2">
          <button type="button" onClick={onOpenFavorites} className={row}>
            <IconStar /> {t('favorites')}
            {favCount > 0 && (
              <span className="ml-auto tabular-nums text-ink-3">{favCount}</span>
            )}
          </button>

          <button type="button" onClick={onFeedback} className={row}>
            <IconChat /> {t('feedback')}
          </button>

          {/* 語言:就地展開,不用浮層下拉 */}
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className={row}
          >
            <IconLanguages /> {t('language')}
            <span className="ml-auto text-xs text-ink-3">
              {LANGS.find((l) => l.code === lang)?.label}
            </span>
          </button>
          {langOpen && (
            <div className="grid grid-cols-2 gap-1 px-2 pb-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code)
                    setLangOpen(false)
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    l.code === lang
                      ? 'bg-accent/15 font-medium text-accent'
                      : 'text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
          {/* 正面視角與透明度不在此:已移到模型區右下角的漂浮操作鈕 */}
        </div>

        {/* 肌肉清單(填滿剩餘高度,可捲動) */}
        <div className="min-h-0 flex-1">
          <MuscleList
            embedded
            selectedName={selectedName}
            onSelect={onSelectMuscle}
            onClose={onClose}
          />
        </div>

        {/* 關於 / 授權(法律標註收在這裡,不常駐佔畫面) */}
        <button
          type="button"
          onClick={onAbout}
          className="flex items-center gap-2.5 border-t border-line px-4 py-3 text-sm text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-2"
        >
          <IconInfo /> {t('about')}
        </button>
      </aside>
    </div>,
    document.body,
  )
}
