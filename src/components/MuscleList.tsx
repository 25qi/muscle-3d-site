import { useMemo, useState } from 'react'
import { MUSCLE_LIST } from '../data/muscleList'
import { MUSCLE_MAP, groupLabel } from '../data/muscleMap'
import { muscleNameEn, muscleNameZh, symmetryKey } from '../data/muscleNameZh'
import { resolveMuscle } from '../lib/recommend'
import { useLang, useT, useUiLang } from '../lib/i18n'

interface MuscleListProps {
  selectedName: string | null
  onSelect: (name: string) => void
  onClose: () => void
  /**
   * 嵌在手機側邊選單裡:填滿寬度、去掉自身外框與關閉鈕(選單自帶),
   * 也不自動聚焦搜尋框(避免一開選單就彈鍵盤)。
   */
  embedded?: boolean
}

interface Item {
  base: string
  zh: string
  en: string
  groupId: string | null // 訓練肌群 id;null = 未支援
}

// 預先算好每條肌肉的中英名與所屬訓練分類(只算一次)
const ITEMS: Item[] = MUSCLE_LIST.map((base) => ({
  base,
  zh: muscleNameZh(base) ?? base,
  en: muscleNameEn(base),
  groupId: resolveMuscle(base)?.id ?? null,
}))

/** 依訓練分類折疊的可搜尋肌肉清單:點開分類才顯示其肌肉,點名字即選取高亮。 */
export function MuscleList({
  selectedName,
  onSelect,
  onClose,
  embedded = false,
}: MuscleListProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const t = useT()
  const { lang } = useLang()
  const uiLang = useUiLang()
  const en = uiLang === 'en'
  const nameOf = (it: Item) => (en ? it.en : it.zh)

  const q = query.trim().toLowerCase()
  const selectedKey = selectedName ? symmetryKey(selectedName) : null

  // 依語言分組、過濾、排序(未支援放最後)
  const groups = useMemo(() => {
    const all = [
      ...MUSCLE_MAP.map((m) => ({
        id: m.id,
        label: groupLabel(m, lang),
        labelEn: groupLabel(m, 'en'),
        items: ITEMS.filter((it) => it.groupId === m.id),
      })),
      {
        id: 'unsupported',
        label: t('unsupported'),
        labelEn: 'Unsupported',
        items: ITEMS.filter((it) => it.groupId === null),
      },
    ]
    return all
      .map((g) => ({
        ...g,
        items: g.items
          .filter(
            (it) =>
              !q ||
              it.zh.toLowerCase().includes(q) ||
              it.en.toLowerCase().includes(q) ||
              it.base.includes(q),
          )
          .sort((a, b) =>
            (en ? a.en : a.zh).localeCompare(en ? b.en : b.zh, en ? 'en' : 'zh-Hant'),
          ),
      }))
      .filter((g) => g.items.length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, en, lang])

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div
      className={
        embedded
          ? 'flex h-full w-full flex-col text-ink'
          : 'flex h-full w-64 max-w-[85vw] flex-col border-r border-line bg-surface/70 text-ink backdrop-blur-xl'
      }
    >
      <div className="flex items-center gap-2 border-b border-line p-3">
        <input
          autoFocus={!embedded}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchMuscles')}
          className="min-w-0 flex-1 rounded-lg border border-line bg-ground px-2.5 py-2 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-accent/60"
        />
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="flex-none rounded-lg px-2 py-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label={t('close')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <div className="p-4 text-sm text-ink-3">{t('noMuscles')}</div>
        )}
        {groups.map((g) => {
          const expanded = q !== '' || open.has(g.id)
          const unsupported = g.id === 'unsupported'
          return (
            <div key={g.id} className="border-b border-line/60">
              <button
                type="button"
                onClick={() => toggle(g.id)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {!unsupported && (
                    <span className="inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent/70" />
                  )}
                  <span className="min-w-0">
                    <span
                      className={
                        'flex items-center gap-1.5 ' +
                        (unsupported ? 'text-ink-3' : 'text-ink')
                      }
                    >
                      {g.label}
                      <span className="text-xs text-ink-3">
                        {g.items.length}
                      </span>
                    </span>
                    {/* 英文小字(名稱本身已是英文時不重複) */}
                    {g.label !== g.labelEn && (
                      <span className="block truncate text-[11px] font-normal text-ink-3">
                        {g.labelEn}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={
                    'text-lg leading-none text-ink-3 transition-transform ' +
                    (expanded ? 'rotate-180' : '')
                  }
                >
                  ▾
                </span>
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
                            'block w-full border-l-2 py-1.5 pr-3 pl-5 text-left transition-colors ' +
                            (active
                              ? 'border-accent bg-accent/10'
                              : 'border-transparent hover:bg-surface-2')
                          }
                        >
                          <span
                            className={
                              'block truncate text-sm ' +
                              (active ? 'text-accent' : 'text-ink-2')
                            }
                          >
                            {nameOf(it)}
                          </span>
                          {/* 英文小字(任何語言都顯示;主名已是英文時不重複) */}
                          {nameOf(it) !== it.en && (
                            <span className="block truncate text-[11px] text-ink-3 capitalize">
                              {it.en}
                            </span>
                          )}
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
