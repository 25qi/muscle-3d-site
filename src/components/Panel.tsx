import { useEffect, useMemo, useState } from 'react'
import type { MuscleDef } from '../data/muscleMap'
import { muscleNameZh } from '../data/muscleNameZh'
import { PROVIDERS, type NormalizedExercise } from '../lib/providers'

interface PanelProps {
  /** 被點到的 mesh 原始解剖名稱(null = 還沒點) */
  meshName: string | null
  /** 解析到的肌群(null = 尚未支援) */
  muscle: MuscleDef | null
  /** 是否顯示「我的最愛」模式 */
  showFavorites: boolean
  /** 關閉「我的最愛」模式 */
  onCloseFavorites: () => void
  /** 已收藏的動作 id */
  favorites: Set<string>
  /** 切換收藏 */
  toggleFav: (id: string) => void
}

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

const provider = PROVIDERS[0]

/** 單張動作卡(肌肉模式與最愛模式共用)。 */
function ExerciseCard({
  ex,
  open,
  onToggleExpand,
  favorited,
  onToggleFav,
}: {
  ex: NormalizedExercise
  open: boolean
  onToggleExpand: () => void
  favorited: boolean
  onToggleFav: () => void
}) {
  return (
    <li
      className={
        'overflow-hidden rounded-xl border bg-surface-2 transition-colors ' +
        (open ? 'border-accent/40' : 'border-line hover:border-ink-3/40')
      }
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          onClick={onToggleExpand}
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
            <div className="font-medium text-ink">{ex.nameZh}</div>
            <div className="truncate text-xs text-ink-3 capitalize">
              {ex.name}
            </div>
            {/* 這個動作訓練到哪些肌肉 */}
            <div className="mt-1 truncate text-xs">
              <span className="text-ink-2">{ex.targetMuscle}</span>
              {ex.secondaryMuscles.length > 0 && (
                <span className="text-ink-3">
                  {' · '}
                  {ex.secondaryMuscles.join('、')}
                </span>
              )}
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

        <button
          type="button"
          onClick={onToggleFav}
          aria-label={favorited ? '移除最愛' : '加入最愛'}
          className={
            'flex-none px-1 text-lg leading-none transition-colors ' +
            (favorited ? 'text-warn' : 'text-ink-3 hover:text-warn')
          }
        >
          {favorited ? '★' : '☆'}
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
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
                <span className="mt-1 block text-ink">{ex.stepsZh[i]}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}

export function Panel({
  meshName,
  muscle,
  showFavorites,
  onCloseFavorites,
  favorites,
  toggleFav,
}: PanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [primaryOnly, setPrimaryOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [equip, setEquip] = useState<string | null>(null)

  const isFav = (id: string) => favorites.has(id)

  // 切換肌肉/模式時重置展開與篩選
  useEffect(() => {
    setExpandedId(null)
    setPrimaryOnly(false)
    setFavOnly(false)
    setEquip(null)
  }, [meshName, showFavorites])

  const all = useMemo(
    () => (muscle ? provider.forMuscle(muscle.id) : []),
    [muscle],
  )

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
          (!favOnly || isFav(ex.id)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, primaryOnly, equip, favOnly, favorites],
  )

  // ── 我的最愛模式 ──
  if (showFavorites) {
    const items = [...favorites]
      .map((id) => provider.byId(id))
      .filter((e): e is NormalizedExercise => e !== null)
    // 依「主要訓練肌肉」分組(保留加入順序)
    const groups: { label: string; items: NormalizedExercise[] }[] = []
    for (const ex of items) {
      let g = groups.find((x) => x.label === ex.targetMuscle)
      if (!g) {
        g = { label: ex.targetMuscle, items: [] }
        groups.push(g)
      }
      g.items.push(ex)
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              我的最愛
            </h2>
            <div className="mt-0.5 text-xs text-ink-3">
              {items.length} 個收藏動作
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseFavorites}
            className="rounded-lg px-2 py-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-3xl text-ink-3">☆</div>
            <p className="max-w-[16rem] text-sm leading-relaxed text-ink-2">
              還沒有收藏。點任何動作卡右側的 ☆ 就能加入,收藏會留在這個瀏覽器。
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="mb-2 px-1 text-xs font-medium tracking-wide text-ink-3">
                  {g.label}
                  <span className="ml-1.5 text-ink-3/70">{g.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {g.items.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      ex={ex}
                      open={expandedId === ex.id}
                      onToggleExpand={() =>
                        setExpandedId(expandedId === ex.id ? null : ex.id)
                      }
                      favorited={isFav(ex.id)}
                      onToggleFav={() => toggleFav(ex.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── 空狀態(引導卡)──
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
        <p className="flex items-center gap-1.5 text-xs text-ink-3">
          <span className="text-base">←</span>
          旋轉、點選左側的 3D 模型,或用左上的「肌肉清單」搜尋
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
      <div className="border-b border-line p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          {nameZh}
        </h2>
        <div className="mt-0.5 text-xs tracking-wide text-ink-3 capitalize">
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
            {exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                open={expandedId === ex.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === ex.id ? null : ex.id)
                }
                favorited={isFav(ex.id)}
                onToggleFav={() => toggleFav(ex.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
