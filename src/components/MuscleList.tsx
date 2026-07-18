import { useMemo, useState } from 'react'
import { MUSCLE_LIST } from '../data/muscleList'
import { MUSCLE_MAP } from '../data/muscleMap'
import { muscleNameZh } from '../data/muscleNameZh'
import { resolveMuscle } from '../lib/recommend'

interface MuscleListProps {
  selectedName: string | null
  onSelect: (name: string) => void
  onClose: () => void
}

interface Item {
  base: string
  zh: string
  groupId: string | null // 訓練肌群 id;null = 未支援
}

// 預先算好每條肌肉的中文名與所屬訓練分類(只算一次)
const ITEMS: Item[] = MUSCLE_LIST.map((base) => ({
  base,
  zh: muscleNameZh(base) ?? base,
  groupId: resolveMuscle(base)?.id ?? null,
}))

// 依訓練分類分組(MUSCLE_MAP 順序,未支援放最後)
const GROUPS = [
  ...MUSCLE_MAP.map((m) => ({
    id: m.id,
    label: m.labelZh,
    items: ITEMS.filter((it) => it.groupId === m.id).sort((a, b) =>
      a.zh.localeCompare(b.zh, 'zh-Hant'),
    ),
  })),
  {
    id: 'unsupported',
    label: '未支援',
    items: ITEMS.filter((it) => it.groupId === null).sort((a, b) =>
      a.zh.localeCompare(b.zh, 'zh-Hant'),
    ),
  },
].filter((g) => g.items.length > 0)

function keyOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b(left|right)\b/g, '')
    .replace(/\s*\(\d+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 依訓練分類折疊的可搜尋肌肉清單:點開分類才顯示其肌肉,點名字即選取高亮。 */
export function MuscleList({ selectedName, onSelect, onClose }: MuscleListProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())

  const q = query.trim().toLowerCase()
  const selectedKey = selectedName ? keyOf(selectedName) : null

  // 搜尋時:過濾各分類的肌肉,並自動展開有結果的分類
  const groups = useMemo(() => {
    if (!q) return GROUPS
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (it) => it.zh.toLowerCase().includes(q) || it.base.includes(q),
      ),
    })).filter((g) => g.items.length > 0)
  }, [q])

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <div className="p-3 text-sm text-neutral-500">找不到符合的肌肉</div>
        )}
        {groups.map((g) => {
          const expanded = q !== '' || open.has(g.id)
          return (
            <div key={g.id} className="border-b border-neutral-800/60">
              <button
                type="button"
                onClick={() => toggle(g.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-neutral-200 hover:bg-neutral-800/50"
              >
                <span
                  className={g.id === 'unsupported' ? 'text-neutral-500' : ''}
                >
                  {g.label}
                  <span className="ml-1.5 text-xs text-neutral-600">
                    {g.items.length}
                  </span>
                </span>
                <span className="text-neutral-600">{expanded ? '▲' : '▼'}</span>
              </button>

              {expanded && (
                <ul className="pb-1">
                  {g.items.map((it) => {
                    const active = selectedKey === it.base
                    return (
                      <li key={it.base}>
                        <button
                          type="button"
                          onClick={() => onSelect(it.base)}
                          className={
                            'block w-full truncate py-1.5 pr-3 pl-6 text-left text-sm hover:bg-neutral-800/60 ' +
                            (active
                              ? 'bg-blue-500/15 text-blue-200'
                              : 'text-neutral-300')
                          }
                        >
                          {it.zh}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
