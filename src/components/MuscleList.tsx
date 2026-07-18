import { useMemo, useState } from 'react'
import { MUSCLE_LIST } from '../data/muscleList'
import { muscleNameZh } from '../data/muscleNameZh'
import { resolveMuscle } from '../lib/recommend'

interface MuscleListProps {
  /** 目前選中的名稱(用來標示 active) */
  selectedName: string | null
  /** 點清單項目時回呼該肌肉基本名(可直接當 selectedName) */
  onSelect: (name: string) => void
  onClose: () => void
}

// 預先算好每條肌肉的中文名與是否支援(只算一次)
const ITEMS = MUSCLE_LIST.map((base) => ({
  base,
  zh: muscleNameZh(base) ?? base,
  supported: resolveMuscle(base) !== null,
})).sort((a, b) => {
  // 有支援的排前面,其餘依中文名排序
  if (a.supported !== b.supported) return a.supported ? -1 : 1
  return a.zh.localeCompare(b.zh, 'zh-Hant')
})

/** 可搜尋的完整肌肉清單:輸入關鍵字過濾,點名字即選取高亮。 */
export function MuscleList({ selectedName, onSelect, onClose }: MuscleListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ITEMS
    return ITEMS.filter(
      (it) => it.zh.toLowerCase().includes(q) || it.base.includes(q),
    )
  }, [query])

  return (
    <div className="flex h-full w-64 flex-col border-r border-neutral-800 bg-neutral-950/95 text-neutral-200 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-neutral-800 p-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋肌肉(中/英)"
          className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-blue-400"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex-none rounded-md px-2 py-1 text-neutral-500 hover:text-neutral-200"
          aria-label="關閉清單"
        >
          ✕
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <li className="p-3 text-sm text-neutral-500">找不到符合的肌肉</li>
        )}
        {filtered.map((it) => {
          const active = selectedName != null && resolveKey(selectedName) === it.base
          return (
            <li key={it.base}>
              <button
                type="button"
                onClick={() => onSelect(it.base)}
                className={
                  'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-neutral-800/60 ' +
                  (active ? 'bg-blue-500/15 text-blue-200' : 'text-neutral-300')
                }
              >
                <span className="truncate">{it.zh}</span>
                {!it.supported && (
                  <span className="flex-none text-[10px] text-neutral-600">
                    未支援
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** 把選中的名稱正規化成 MUSCLE_LIST 的基本名,用來標示清單的 active 項目。 */
function resolveKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b(left|right)\b/g, '')
    .replace(/\s*\(\d+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
