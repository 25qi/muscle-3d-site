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

export function Panel({ meshName, muscle }: PanelProps) {
  // 目前選的資料庫分頁 + 展開看步驟的動作
  const [providerId, setProviderId] = useState(PROVIDERS[0].id)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  useEffect(() => setExpandedId(null), [meshName, providerId])

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  const exercises = useMemo(
    () => (muscle ? provider.forMuscle(muscle.id) : []),
    [muscle, provider],
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

  return (
    <div className="flex h-full flex-col">
      {/* 標頭:中文肌肉名 + 英文原名 + 支援標籤 */}
      <div className="border-b border-neutral-800 p-4">
        <h2 className="text-xl font-semibold text-neutral-100">{nameZh}</h2>
        <div className="mt-0.5 text-xs tracking-wide text-neutral-500">
          {nameEn}
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

      {!muscle ? (
        <div className="flex-1 p-4 text-sm text-neutral-500">
          這塊肌肉不在目前支援的 12 個訓練肌群內。
        </div>
      ) : (
        <>
          {/* 資料庫分頁 */}
          <div className="flex border-b border-neutral-800">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProviderId(p.id)}
                className={
                  'flex-1 border-b-2 px-3 py-2 text-sm transition-colors ' +
                  (p.id === providerId
                    ? 'border-blue-400 text-neutral-100'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300')
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 動作清單 */}
          <ul className="flex-1 space-y-2 overflow-y-auto p-4">
            <li className="text-xs text-neutral-600">
              {exercises.length} 個動作 · 授權 {provider.license}
            </li>
            {exercises.length === 0 && (
              <li className="text-neutral-500">此資料庫找不到對應的動作</li>
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
                            {ex.equipment}
                          </span>
                        )}
                        {ex.level && (
                          <span className="rounded bg-neutral-700/40 px-1.5 py-0.5 text-neutral-400">
                            {ex.level}
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
        </>
      )}
    </div>
  )
}
