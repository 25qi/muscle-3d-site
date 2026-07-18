import { useEffect, useMemo, useState } from 'react'
import type { MuscleDef } from '../data/muscleMap'
import { muscleNameZh } from '../data/muscleNameZh'
import { PROVIDERS } from '../lib/providers'
import { useFavorites } from '../lib/useFavorites'

interface PanelProps {
  /** 被點到的 mesh 原始解剖名稱(null = 還沒點) */
  meshName: string | null
  /** 解析到的肌群(null = 尚未支援) */
  muscle: MuscleDef | null
  /** 開啟左側肌肉清單(空狀態引導卡的主要行動) */
  onOpenList: () => void
}

// 器材中文對照(ExerciseDB 的 equipment 值 → 中文)
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
  'sled machine': '雪橇機',
  'medicine ball': '藥球',
  rope: '繩索',
  roller: '滾輪',
  'resistance band': '阻力帶',
  'bosu ball': 'BOSU 球',
  'olympic barbell': '奧林匹克槓',
  'trap bar': '六角槓',
}
const equipZh = (e: string) => EQUIP_ZH[e] ?? e

// 目前只有一個資料庫;若之後 providers 增加可再加分頁
const provider = PROVIDERS[0]

export function Panel({ meshName, muscle, onOpenList }: PanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [primaryOnly, setPrimaryOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [equip, setEquip] = useState<string | null>(null)
  const { toggle: toggleFav, isFavorite } = useFavorites()

  // 切換肌肉時重置展開與篩選
  useEffect(() => {
    setExpandedId(null)
    setPrimaryOnly(false)
    setFavOnly(false)
    setEquip(null)
  }, [meshName])

  const all = useMemo(
    () => (muscle ? provider.forMuscle(muscle.id) : []),
    [muscle],
  )

  // 依出現次數排序的器材選項(只列當前肌肉有的)
  const equipOptions = useMemo(() => {
    const count = new Map<string, number>()
    for (const ex of all) {
      if (ex.equipment) count.set(ex.equipment, (count.get(ex.equipment) ?? 0) + 1)
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e)
  }, [all])

  const exercises = useMemo(
    () =>
      all.filter(
        (ex) =>
          (!primaryOnly || ex.isPrimary) &&
          (!equip || ex.equipment === equip) &&
          (!favOnly || isFavorite(ex.id)),
      ),
    [all, primaryOnly, equip, favOnly, isFavorite],
  )

  if (!meshName) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-3xl text-accent ring-1 ring-accent/30">
          ✛
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-ink">開始探索肌肉群</h3>
          <p className="mx-auto max-w-[16rem] text-sm leading-relaxed text-ink-2">
            選一塊肌肉,立刻看到最適合訓練它的動作、器材與分解步驟。
          </p>
        </div>

        {/* 主要行動:開啟肌肉清單 */}
        <button
          type="button"
          onClick={onOpenList}
          className="hint-pulse flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ground transition-transform hover:scale-[1.03]"
        >
          ☰ 開啟肌肉清單
        </button>

        {/* 次要提示:直接操作 3D */}
        <p className="flex items-center gap-1.5 text-xs text-ink-3">
          <span className="text-base">←</span>
          或直接旋轉、點選左側的 3D 模型
        </p>
      </div>
    )
  }

  const nameZh = muscleNameZh(meshName) ?? meshName
  const nameEn = meshName
    .replace(/_/g, ' ')
    .replace(/\b(left|right)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const chip = (active: boolean) =>
    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors ' +
    (active
      ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
      : 'bg-surface-2 text-ink-3 ring-1 ring-line hover:text-ink-2')

  return (
    <div className="flex h-full flex-col">
      {/* 標頭 */}
      <div className="border-b border-line p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          {nameZh}
        </h2>
        <div className="mt-1 text-xs tracking-wide text-ink-3 capitalize">
          {nameEn}
        </div>

        {muscle ? (
          <>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {muscle.labelZh}
              </span>
            </div>

            {/* 可點擊篩選標籤 */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFavOnly((v) => !v)}
                className={chip(favOnly)}
              >
                ★ 只看最愛
              </button>
              <button
                type="button"
                onClick={() => setPrimaryOnly((v) => !v)}
                className={chip(primaryOnly)}
              >
                只看主要
              </button>
              {equipOptions.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEquip((cur) => (cur === e ? null : e))}
                  className={chip(equip === e)}
                >
                  {equipZh(e)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-3 py-1 text-sm font-medium text-warn">
              尚未支援
            </span>
          </div>
        )}
      </div>

      {!muscle ? (
        <div className="flex-1 p-5 text-sm leading-relaxed text-ink-3">
          這塊肌肉不在目前支援的 12 個訓練肌群內,因此沒有推薦動作。你仍可從左側清單瀏覽其他肌肉。
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-xs text-ink-3">
            <span>
              <span className="tabular-nums text-ink-2">{exercises.length}</span>{' '}
              / {all.length} 個動作
            </span>
            <span>{provider.label}</span>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto px-4 pt-1 pb-4">
            {exercises.length === 0 && (
              <li className="px-1 py-6 text-center text-sm text-ink-3">
                沒有符合篩選的動作
              </li>
            )}
            {exercises.map((ex) => {
              const open = expandedId === ex.id
              return (
                <li
                  key={ex.id}
                  className={
                    'overflow-hidden rounded-xl border bg-surface-2 transition-colors ' +
                    (open ? 'border-accent/40' : 'border-line hover:border-ink-3/40')
                  }
                >
                  <div className="flex items-center gap-2 p-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : ex.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {ex.imageUrl && (
                        <img
                          src={ex.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-16 w-16 flex-none rounded-lg bg-ground object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-ink capitalize">
                          {ex.name}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                          <span
                            className={
                              ex.isPrimary
                                ? 'rounded-md bg-accent/15 px-1.5 py-0.5 font-medium text-accent'
                                : 'rounded-md bg-line/60 px-1.5 py-0.5 text-ink-3'
                            }
                          >
                            {ex.isPrimary ? '主要' : '輔助'}
                          </span>
                          {ex.equipment && (
                            <span className="rounded-md bg-line/60 px-1.5 py-0.5 text-ink-2">
                              {equipZh(ex.equipment)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* 加入最愛 */}
                    <button
                      type="button"
                      onClick={() => toggleFav(ex.id)}
                      aria-label={isFavorite(ex.id) ? '移除最愛' : '加入最愛'}
                      className={
                        'flex-none px-1 text-lg leading-none transition-colors ' +
                        (isFavorite(ex.id)
                          ? 'text-warn'
                          : 'text-ink-3 hover:text-warn')
                      }
                    >
                      {isFavorite(ex.id) ? '★' : '☆'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : ex.id)}
                      aria-label={open ? '收合' : '展開'}
                      className={
                        'flex-none px-1 text-lg leading-none text-ink-3 transition-transform ' +
                        (open ? 'rotate-180' : '')
                      }
                    >
                      ▾
                    </button>
                  </div>

                  {open && ex.steps.length > 0 && (
                    <ol className="list-decimal space-y-3 border-t border-line px-5 py-4 pl-8 text-sm marker:text-ink-3">
                      {ex.steps.map((step, i) => (
                        <li key={i}>
                          <span className="text-ink-2">{step}</span>
                          {ex.stepsZh[i] && (
                            <span className="mt-1 block text-ink">
                              {ex.stepsZh[i]}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
