import { useEffect, useState } from 'react'
import type { MuscleDef } from '../data/muscleMap'
import { muscleNameZh } from '../data/muscleNameZh'
import { IMAGE_BASE, type RankedExercise } from '../lib/recommend'

interface PanelProps {
  /** 被點到的 mesh 原始解剖名稱(null = 還沒點) */
  meshName: string | null
  /** 解析到的肌群(null = 尚未支援) */
  muscle: MuscleDef | null
  /** 排序後的動作清單 */
  exercises: RankedExercise[]
}

export function Panel({ meshName, muscle, exercises }: PanelProps) {
  // 目前展開看步驟的動作 id;切換肌肉時收合
  const [expandedId, setExpandedId] = useState<string | null>(null)
  useEffect(() => setExpandedId(null), [meshName])

  if (!meshName) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-neutral-500">
        點選左側的肌肉,這裡會列出推薦訓練動作
      </div>
    )
  }

  // 這塊肌肉的中文名(找不到就退回英文原名)
  const nameZh = muscleNameZh(meshName) ?? meshName

  return (
    <div className="flex h-full flex-col">
      {/* 標頭:中文肌肉名(大)+ 英文原名(小)+ 支援標籤 */}
      <div className="border-b border-neutral-800 p-4">
        <h2 className="text-xl font-semibold text-neutral-100">{nameZh}</h2>
        <div className="mt-0.5 text-xs tracking-wide text-neutral-500">
          {/* 不分左右:英文原名也去掉 left/right */}
          {meshName
            .replace(/_/g, ' ')
            .replace(/\b(left|right)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()}
        </div>
        <div className="mt-2">
          {muscle ? (
            <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-0.5 text-sm text-blue-300">
              訓練分類 · {muscle.labelZh}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm text-amber-400">
              尚未支援
            </span>
          )}
        </div>
      </div>

      {/* 動作清單 */}
      {muscle ? (
        <ul className="flex-1 space-y-2 overflow-y-auto p-4">
          {exercises.length === 0 && (
            <li className="text-neutral-500">找不到對應的動作</li>
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
                  {ex.images[0] && (
                    <img
                      src={IMAGE_BASE + ex.images[0]}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 flex-none rounded-md bg-neutral-800 object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-100">{ex.name}</div>
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
                          {ex.equipment}
                        </span>
                      )}
                      <span className="rounded bg-neutral-700/40 px-1.5 py-0.5 text-neutral-400">
                        {ex.level}
                      </span>
                    </div>
                  </div>
                  <span className="flex-none pt-1 text-neutral-500">
                    {open ? '▲' : '▼'}
                  </span>
                </button>

                {/* 展開:動作步驟 */}
                {open && (
                  <ol className="list-decimal space-y-1.5 border-t border-neutral-800 px-4 py-3 pl-8 text-sm text-neutral-300">
                    {ex.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex-1 p-4 text-sm text-neutral-500">
          這塊肌肉不在目前支援的 12 個訓練肌群內。
        </div>
      )}
    </div>
  )
}
