import { useState } from 'react'
import { useT } from '../lib/i18n'
import { IconOpacity, IconReset } from './icons'

interface ViewportControlsProps {
  opacity: number
  setOpacity: (v: number) => void
  onReset: () => void
}

/**
 * 手機專屬:漂浮在模型區右下角的操作鈕(正面視角 + 透明度),
 * 仿 3D 軟體把視圖操作放在畫面角落的做法。桌機這些仍在頂部工具列。
 */
export function ViewportControls({
  opacity,
  setOpacity,
  onReset,
}: ViewportControlsProps) {
  const t = useT()
  const [openOpacity, setOpenOpacity] = useState(false)

  const btn =
    'flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-surface/80 text-ink-2 shadow-lg backdrop-blur-md transition-colors active:bg-surface-2'

  return (
    <div className="pointer-events-auto absolute right-3 bottom-3 z-20 flex flex-col items-end gap-2 md:hidden">
      {/* 透明度:點按展開橫向拉桿 */}
      {openOpacity ? (
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface/85 py-2 pr-2 pl-3 shadow-lg backdrop-blur-md">
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            aria-label={t('opacity')}
            className="range-accent w-32"
            style={
              {
                '--range-progress': (opacity - 0.15) / 0.85,
                '--range-fill': 'var(--color-accent)',
                '--range-thumb': 'var(--color-accent)',
              } as React.CSSProperties
            }
          />
          <button
            type="button"
            onClick={() => setOpenOpacity(false)}
            aria-label={t('opacity')}
            className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-accent"
          >
            <IconOpacity />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpenOpacity(true)}
          aria-label={t('opacity')}
          className={btn}
        >
          <IconOpacity />
        </button>
      )}

      {/* 正面視角 */}
      <button type="button" onClick={onReset} aria-label={t('resetView')} className={btn}>
        <IconReset />
      </button>
    </div>
  )
}
