import { useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n'

/**
 * AdSense 版位。整個廣告系統由環境變數控制(見 .env.example):
 *   VITE_ADS_ENABLED   總開關,要全站下架廣告就改成 false 重新 deploy
 *   VITE_ADS_CLIENT    AdSense 發布商 ID(ca-pub-…)
 *   VITE_ADS_SLOT_*    各版位的 ad unit ID,沒填的版位不會渲染
 *
 * 三個政策限制直接寫進實作,改動前先看一眼:
 * - AdSense 不得整合進軟體應用程式,所以 Capacitor 殼內連主程式都不載入(App 要變現用 AdMob)。
 * - 廣告不可長得像周圍內容,所以刻意用虛線框與「廣告」標示,和動作卡明顯區隔。
 * - 廣告不可緊鄰互動元素,所以只用在面板的捲動清單內,不放 3D canvas、燈箱或任何浮層上。
 */

const CLIENT = import.meta.env.VITE_ADS_CLIENT
const ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true'

/** 各版位的 ad unit ID(在 AdSense 後台建立廣告單元後取得) */
export const AD_SLOTS = {
  feed: import.meta.env.VITE_ADS_SLOT_FEED,
  panelEnd: import.meta.env.VITE_ADS_SLOT_PANEL_END,
}

/** Capacitor(iOS/Android 殼)內一律不顯示廣告 */
function inNativeShell() {
  if (typeof window === 'undefined') return false
  return (
    'Capacitor' in window ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:'
  )
}

/** 廣告是否可用:總開關 + 有發布商 ID + 不在原生殼內 */
export function adsAvailable() {
  return ENABLED && Boolean(CLIENT) && !inNativeShell()
}

/** AdSense 主程式只載入一次,而且只在網頁版載入 */
let scriptPromise: Promise<void> | null = null
function loadAdsScript() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
    s.async = true
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('adsbygoogle load failed'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

interface AdSlotProps {
  /** ad unit ID;undefined 代表這個版位還沒設定,直接不渲染 */
  slot: string | undefined
  className?: string
}

export function AdSlot({ slot, className = '' }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null)
  // 同一個 ins 元素 push 兩次會丟 TagError,用 ref 擋掉 StrictMode 的重複觸發
  const pushed = useRef(false)
  // 沒有廣告可填(no fill / 被擋)時不要留一個空的「廣告」框在清單裡
  const [filled, setFilled] = useState(false)
  const t = useT()

  useEffect(() => {
    if (!adsAvailable() || !slot || pushed.current || !insRef.current) return
    pushed.current = true
    loadAdsScript()
      .then(() => {
        const w = window as Window & { adsbygoogle?: unknown[] }
        w.adsbygoogle = w.adsbygoogle ?? []
        w.adsbygoogle.push({})
      })
      .catch(() => {
        // 被擋廣告或載入失敗:靜默略過,版面不受影響
      })
  }, [slot])

  // AdSense 填好廣告會把 data-ad-status 設成 filled,沒庫存則是 unfilled
  useEffect(() => {
    const el = insRef.current
    if (!adsAvailable() || !slot || !el) return
    const update = () => setFilled(el.getAttribute('data-ad-status') === 'filled')
    const mo = new MutationObserver(update)
    mo.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] })
    update()
    return () => mo.disconnect()
  }, [slot])

  if (!adsAvailable() || !slot) return null

  return (
    // 外框與標示只在真的有廣告時才出現;ins 本身不能 display:none,否則量不到尺寸
    <div
      className={
        (filled
          ? 'rounded-xl border border-dashed border-line/70 bg-ground/40 p-2 '
          : '') + className
      }
    >
      {filled && (
        <div className="mb-1 text-[10px] tracking-wide text-ink-3 uppercase">
          {t('ad')}
        </div>
      )}
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
