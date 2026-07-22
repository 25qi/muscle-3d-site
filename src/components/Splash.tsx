import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/** 收起前至少顯示這麼久,避免快取命中時閃一下就消失 */
const MIN_VISIBLE_MS = 500
/** 淡出時間,需與下方 transition 一致 */
const FADE_MS = 400

/**
 * 啟動畫面:蓋住整個畫面直到 3D 模型真的載入完成(而非固定秒數),
 * 再淡出。避免初次進站時看到白閃與模型跳一下。
 */
export function Splash({ ready }: { ready: boolean }) {
  const { progress } = useProgress() // drei 的全域載入進度(可在 Canvas 外使用)
  const [hidden, setHidden] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!ready) return
    // 從掛載起算最短顯示時間,時間到才開始淡出
    const start = performance.now()
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - start))
    const t1 = setTimeout(() => setFading(true), wait)
    const t2 = setTimeout(() => setHidden(true), wait + FADE_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [ready])

  if (hidden) return null

  return (
    <div
      className={
        'fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-ground transition-opacity duration-400 ' +
        (fading ? 'pointer-events-none opacity-0' : 'opacity-100')
      }
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="text-2xl font-semibold tracking-tight text-ink">
          Vector
        </span>
      </div>
      <div className="text-xs tracking-wide text-ink-3">
        3D Muscle Explorer
      </div>

      <div className="mt-1 h-0.5 w-40 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${ready ? 100 : Math.round(progress)}%` }}
        />
      </div>
      <div className="text-[11px] text-ink-3">Loading…</div>
    </div>
  )
}
