import { useEffect, useMemo, useState } from 'react'
import type { MuscleDef } from '../data/muscleMap'
import { muscleNameZh } from '../data/muscleNameZh'
import { PROVIDERS } from '../lib/providers'

interface PanelProps {
  /** 被點到的 mesh 原始解剖名稱(null = 還沒點) */
  meshName: string | null
  /** 解析到的肌群(null = 尚未支援) */
  muscle: MuscleDef | null
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

export function Panel({ meshName, muscle }: PanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [primaryOnly, setPrimaryOnly] = useState(false)
  const [equip, setEquip] = useState<string | null>(null)

  // 切換肌肉時重置展開與篩選
  useEffect(() => {
    setExpandedId(null)
    setPrimaryOnly(false)
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
          (!equip || ex.equipment === equip),
      ),
    [all, primaryOnly, equip],
  )

  if (!meshName) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-neutral-500">
        點選左側的肌肉,這裡會列出推薦訓練動作
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
    'rounded-full px-2.5 py-0.5 text-xs transition-colors ' +
    (active
      ? 'bg-blue-500/25 text-blue-200 ring-1 ring-blue-400/50'
      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200')

  return (
    <div className="flex h-full flex-col">
      {/* 標頭:中文肌肉名 + 英文原名 + 訓練分類 + 篩選標籤 */}
      <div className="border-b border-neutral-800 p-4">
        <h2 className="text-xl font-semibold text-neutral-100">{nameZh}</h2>
        <div className="mt-0.5 text-xs tracking-wide text-neutral-500">
          {nameEn}
        </div>

        {muscle ? (
          <>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-0.5 text-sm text-blue-300">
                訓練分類 · {muscle.labelZh}
              </span>
            </div>

            {/* 可點擊篩選標籤 */}
            <div className="mt-2 flex flex-wrap gap-1.5">
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
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm text-amber-400">
              尚未支援
            </span>
          </div>
        )}
      </div>

      {!muscle ? (
        <div className="flex-1 p-4 text-sm text-neutral-500">
          這塊肌肉不在目前支援的 12 個訓練肌群內。
        </div>
      ) : (
        <ul className="flex-1 space-y-2 overflow-y-auto p-4">
          <li className="text-xs text-neutral-600">
            {exercises.length} / {all.length} 個動作 · 授權 {provider.license}
          </li>
          {exercises.length === 0 && (
            <li className="text-neutral-500">沒有符合篩選的動作</li>
          )}
          {exercises.map((ex) => {
            const open = expandedId === ex.id
            return (
              <li
                key={ex.id}
                className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : ex.id)}
                  className="flex w-full items-start gap-3 p-3 text-left hover:bg-neutral-800/40"
                >
                  {ex.imageUrl && (
                    <img
                      src={ex.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 flex-none rounded-md bg-neutral-800 object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-100 capitalize">
                      {ex.name}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      <span
                        className={
                          ex.isPrimary
                            ? 'rounded bg-blue-500/20 px-1.5 py-0.5 text-blue-300'
                            : 'rounded bg-neutral-700/40 px-1.5 py-0.5 text-neutral-400'
                        }
                      >
                        {ex.isPrimary ? '主要' : '輔助'}
                      </span>
                      {ex.equipment && (
                        <span className="rounded bg-neutral-700/40 px-1.5 py-0.5 text-neutral-400">
                          {equipZh(ex.equipment)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex-none pt-1 text-neutral-500">
                    {open ? '▲' : '▼'}
                  </span>
                </button>

                {open && ex.steps.length > 0 && (
                  <ol className="list-decimal space-y-1.5 border-t border-neutral-800 px-4 py-3 pl-8 text-sm text-neutral-300">
                    {ex.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
