import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n'
import { IconOpacity, IconReset } from './icons'

interface ViewportControlsProps {
  opacity: number
  setOpacity: (v: number) => void
  onReset: () => void
}

/** 拉桿出現後多久自動淡出(毫秒);拖動會重新計時 */
const AUTO_HIDE_MS = 3000
/** 淡出動畫時間,需與 transition 一致 */
const FADE_MS = 400

/**
 * 手機專屬:漂浮在模型區右下角的操作鈕(正面視角 + 透明度),
 * 仿 3D 軟體把視圖操作放在畫面角落的做法。桌機這些仍在頂部工具列。
 *
 * 透明度點按後,直向拉桿由按鈕往上長出(兩顆按鈕位置固定不動),
 * 停止操作 3 秒後自動淡出。
 */
export function ViewportControls({
  opacity,
  setOpacity,
  onReset,
}: ViewportControlsProps) {
  const t = useT()
  const [mounted, setMounted] = useState(false) // 拉桿是否在 DOM(含淡出期間)
  const [shown, setShown] = useState(false) // 透明度(觸發淡入/淡出)
  const hideTimer = useRef<number | undefined>(undefined)
  const unmountTimer = useRef<number | undefined>(undefined)

  const clearTimers = () => {
    window.clearTimeout(hideTimer.current)
    window.clearTimeout(unmountTimer.current)
  }

  // 排定「停手 3 秒後淡出」;每次互動都重新計時
  const scheduleHide = () => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      setShown(false)
      unmountTimer.current = window.setTimeout(() => setMounted(false), FADE_MS)
    }, AUTO_HIDE_MS)
  }

  const openSlider = () => {
    window.clearTimeout(unmountTimer.current)
    setMounted(true)
    scheduleHide()
  }

  const closeSlider = () => {
    clearTimers()
    setShown(false)
    unmountTimer.current = window.setTimeout(() => setMounted(false), FADE_MS)
  }

  // 掛載後下一影格再打開透明度,才會有淡入過渡
  useEffect(() => {
    if (!mounted) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [mounted])

  useEffect(() => clearTimers, [])

  const btn =
    'flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-surface/80 shadow-lg backdrop-blur-md transition-colors active:bg-surface-2'

  return (
    <div className="pointer-events-auto absolute right-3 bottom-3 z-20 flex flex-col items-end gap-2 md:hidden">
      {/* 透明度:直向拉桿(往上長出)+ 下方切換鈕。按鈕位置不隨拉桿變動 */}
      <div className="flex flex-col items-center gap-2">
        {mounted && (
          <div
            className={`flex items-center justify-center rounded-full border border-line bg-surface/85 px-1.5 py-3 shadow-lg backdrop-blur-md transition-opacity duration-[400ms] ${
              shown ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* 旋轉 -90° 把水平拉桿變直向(iOS 相容性最穩);填色自動由下往上 */}
            <div
              className="relative flex items-center justify-center"
              style={{ height: 128, width: 28 }}
            >
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => {
                  setOpacity(Number(e.target.value))
                  scheduleHide()
                }}
                aria-label={t('opacity')}
                className="range-accent"
                style={
                  {
                    width: 128,
                    transform: 'rotate(-90deg)',
                    '--range-progress': (opacity - 0.15) / 0.85,
                    '--range-fill': 'var(--color-accent)',
                    '--range-thumb': 'var(--color-accent)',
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => (mounted && shown ? closeSlider() : openSlider())}
          aria-label={t('opacity')}
          className={`${btn} ${
            mounted && shown ? 'text-accent' : 'text-ink-2'
          }`}
        >
          <IconOpacity />
        </button>
      </div>

      {/* 正面視角(位置固定) */}
      <button
        type="button"
        onClick={onReset}
        aria-label={t('resetView')}
        className={`${btn} text-ink-2`}
      >
        <IconReset />
      </button>
    </div>
  )
}
