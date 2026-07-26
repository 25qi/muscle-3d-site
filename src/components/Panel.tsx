import { useEffect, useMemo, useState } from 'react'
import { type MuscleDef, groupLabel } from '../data/muscleMap'
import { muscleNameEn, muscleNameZh } from '../data/muscleNameZh'
import { muscleTerm } from '../data/muscleTerms'
import { equipmentLabel } from '../data/equipmentZh'
import { PROVIDERS, type NormalizedExercise } from '../lib/providers'
import { useLang, useT, useUiLang } from '../lib/i18n'
import { ExerciseModal } from './ExerciseModal'
import { FavoriteStar } from './FavoriteStar'

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
  /** 已收藏的肌肉(去左右的基本名) */
  favMuscles: Set<string>
  /** 切換肌肉收藏 */
  toggleFavMuscle: (base: string) => void
  /** 把 mesh 名稱正規化成肌肉收藏用的基本名 */
  muscleKeyOf: (name: string) => string
  /** 在最愛頁點肌肉 → 選取並聚焦 */
  onPickFavMuscle: (base: string) => void
}


const provider = PROVIDERS[0]

/** 單張動作卡(肌肉模式與最愛模式共用)。點縮圖或標題 → 開全螢幕燈箱。 */
function ExerciseCard({
  ex,
  favorited,
  onToggleFav,
  onOpen,
}: {
  ex: NormalizedExercise
  favorited: boolean
  onToggleFav: () => void
  onOpen: () => void
}) {
  const t = useT()
  const { lang } = useLang()
  const en = useUiLang() === 'en'
  const term = (m: string) => muscleTerm(m, lang)
  const sep = en ? ', ' : '、'
  return (
    <li className="group overflow-hidden rounded-xl border border-line bg-surface-2 transition-colors hover:border-ink-3/40">
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:gap-3"
        >
          {ex.imageUrl && (
            <img
              src={ex.imageUrl}
              alt=""
              loading="lazy"
              className="h-12 w-12 flex-none rounded-lg bg-ground object-cover sm:h-16 sm:w-16"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-ink transition-colors group-hover:text-accent capitalize">
              {en ? ex.name : ex.nameZh}
            </div>
            {!en && (
              <div className="truncate text-xs text-ink-3 capitalize">
                {ex.name}
              </div>
            )}
            <div className="mt-1 truncate text-xs">
              <span className="text-ink-2">{term(ex.targetMuscle)}</span>
              {ex.secondaryMuscles.length > 0 && (
                <span className="text-ink-3">
                  {en ? ' · ' : ' · '}
                  {ex.secondaryMuscles.map(term).join(sep)}
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
                {ex.isPrimary ? t('primary') : t('secondary')}
              </span>
              {ex.equipment && (
                <span className="rounded-md bg-line/60 px-1.5 py-0.5 text-ink-2">
                  {equipmentLabel(ex.equipment, en)}
                </span>
              )}
            </div>
          </div>
        </button>

        <FavoriteStar
          favorited={favorited}
          onToggle={onToggleFav}
          className="px-1"
        />
      </div>
    </li>
  )
}

/** Right-hand panel: selected muscle + its exercises, or the favorites view. */
export function Panel({
  meshName,
  muscle,
  showFavorites,
  onCloseFavorites,
  favorites,
  toggleFav,
  favMuscles,
  toggleFavMuscle,
  muscleKeyOf,
  onPickFavMuscle,
}: PanelProps) {
  const [openEx, setOpenEx] = useState<NormalizedExercise | null>(null)
  const [primaryOnly, setPrimaryOnly] = useState(false)
  const [favOnly, setFavOnly] = useState(false)
  const [equip, setEquip] = useState<string | null>(null)
  const t = useT()
  const en = useUiLang() === 'en'

  const { lang } = useLang()
  const isFav = (id: string) => favorites.has(id)

  // 切換肌肉/模式時重置篩選與燈箱
  useEffect(() => {
    setOpenEx(null)
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

  // 全螢幕燈箱(各模式共用)
  const modal = openEx ? (
    <ExerciseModal
      ex={openEx}
      favorited={isFav(openEx.id)}
      onToggleFav={() => toggleFav(openEx.id)}
      onClose={() => setOpenEx(null)}
    />
  ) : null

  // ── 我的最愛模式 ──
  if (showFavorites) {
    const items = [...favorites]
      .map((id) => provider.byId(id))
      .filter((e): e is NormalizedExercise => e !== null)
    // 收藏的肌肉(基本名 → 顯示名)
    const muscleItems = [...favMuscles].map((base) => ({
      base,
      label: en ? muscleNameEn(base) : (muscleNameZh(base) ?? base),
    }))
    // 依「主要訓練肌肉」分組(保留加入順序);label 依語言在地化
    const groups: { key: string; label: string; items: NormalizedExercise[] }[] =
      []
    for (const ex of items) {
      let g = groups.find((x) => x.key === ex.targetMuscle)
      if (!g) {
        g = {
          key: ex.targetMuscle,
          label: muscleTerm(ex.targetMuscle, lang),
          items: [],
        }
        groups.push(g)
      }
      g.items.push(ex)
    }

    return (
      <div className="flex h-full flex-col">
        {modal}
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {t('favorites')}
            </h2>
            <div className="mt-0.5 text-xs text-ink-3">
              {items.length + muscleItems.length} {t('savedCount')}
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseFavorites}
            className="rounded-lg px-2 py-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>

        {items.length === 0 && muscleItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="text-3xl text-ink-3">☆</div>
            <p className="max-w-[16rem] text-sm leading-relaxed text-ink-2">
              {t('favEmpty')}
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* 收藏的肌肉:點名字 → 選取並聚焦;點星 → 移除收藏 */}
            {muscleItems.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center gap-2 border-b border-line pb-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm font-semibold text-ink">
                    {t('musclesSection')}
                  </span>
                  <span className="text-xs tabular-nums text-ink-3">
                    {muscleItems.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {muscleItems.map((m) => (
                    <li
                      key={m.base}
                      className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => onPickFavMuscle(m.base)}
                        className="min-w-0 flex-1 truncate text-left text-sm text-ink capitalize hover:text-accent"
                      >
                        {m.label}
                      </button>
                      <FavoriteStar
                        favorited
                        onToggle={() => toggleFavMuscle(m.base)}
                        className="px-1"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {items.length > 0 && (
              <div className="mb-2.5 flex items-center gap-2 border-b border-line pb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-sm font-semibold text-ink">
                  {t('exercisesSection')}
                </span>
                <span className="text-xs tabular-nums text-ink-3">
                  {items.length}
                </span>
              </div>
            )}
            {groups.map((g) => (
              <div key={g.key} className="pl-2">
                <div className="mb-2 border-l-2 border-line pl-2 text-xs font-medium tracking-wide text-ink-3">
                  {g.label}
                  <span className="ml-1.5 text-ink-3/70">{g.items.length}</span>
                </div>
                <ul className="space-y-2">
                  {g.items.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      ex={ex}
                      favorited={isFav(ex.id)}
                      onToggleFav={() => toggleFav(ex.id)}
                      onOpen={() => setOpenEx(ex)}
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
          {/* 點選手勢:呼應「旋轉、點選左側的 3D 模型」 */}
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 4.1 12 6" />
            <path d="m5.1 8-2.9-.8" />
            <path d="m6 12-1.9 2" />
            <path d="M7.2 2.2 8 5.1" />
            <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
          </svg>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-ink">{t('exploreTitle')}</h3>
          <p className="mx-auto max-w-[16rem] text-sm leading-relaxed text-ink-2">
            {t('exploreBody')}
          </p>
        </div>
        <p className="max-w-[18rem] text-xs leading-relaxed text-ink-3">
          {t('exploreHint')}
        </p>
      </div>
    )
  }

  // 英文語言:只顯示英文;其他語言(含歐語):中文名為主 + 英文小字
  const primaryName = en
    ? muscleNameEn(meshName)
    : (muscleNameZh(meshName) ?? meshName)
  const secondaryName = en ? null : muscleNameEn(meshName)

  const chip = (active: boolean) =>
    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ' +
    (active
      ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
      : 'bg-surface-2 text-ink-3 ring-1 ring-line hover:text-ink-2')

  const baseKey = muscleKeyOf(meshName)
  const muscleFaved = favMuscles.has(baseKey)

  // 篩選標籤(桌機放標題下方橫排;手機放左欄直排,共用同一份)
  const filterChips = (
    <>
      <button
        type="button"
        onClick={() => setFavOnly((v) => !v)}
        className={chip(favOnly)}
      >
        ★ {t('favOnly')}
      </button>
      <button
        type="button"
        onClick={() => setPrimaryOnly((v) => !v)}
        className={chip(primaryOnly)}
      >
        {t('primaryOnly')}
      </button>
      {equipOptions.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => setEquip((cur) => (cur === e ? null : e))}
          className={chip(equip === e)}
        >
          {equipmentLabel(e, en)}
        </button>
      ))}
    </>
  )

  // 肌群膠囊(手機放標題同行、桌機放標題下方,共用同一份)
  const groupCapsule = muscle ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-accent/40">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      {groupLabel(muscle, lang)}
    </span>
  ) : null

  return (
    <div className="flex h-full flex-col">
      {modal}
      <div className="border-b border-line p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          {/* 手機:標題與肌群膠囊同行(省一行);桌機膠囊改放下方 */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-ink capitalize sm:text-2xl">
              {primaryName}
            </h2>
            <span className="md:hidden">{groupCapsule}</span>
          </div>
          {/* 收藏這塊肌肉 */}
          <FavoriteStar
            favorited={muscleFaved}
            onToggle={() => toggleFavMuscle(baseKey)}
            size="text-2xl"
            className="px-1"
          />
        </div>
        {secondaryName && (
          <div className="mt-0.5 text-xs tracking-wide text-ink-3 capitalize">
            {secondaryName}
          </div>
        )}

        {muscle ? (
          <>
            {/* 桌機:肌群膠囊在標題下方(手機已在標題行) */}
            <div className="mt-3 hidden md:block">{groupCapsule}</div>

            {/* 桌機:標籤橫排在標題下方;手機改放左欄(見下方) */}
            <div className="mt-3 hidden flex-wrap gap-1.5 md:flex">
              {filterChips}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent">
              {t('notSupportedYet')}
            </span>
          </div>
        )}
      </div>

      {!muscle ? (
        <div className="flex-1 p-5 text-sm leading-relaxed text-ink-3">
          {t('notSupportedBody')}
        </div>
      ) : (
        // 手機:左欄放標籤、右欄瀏覽動作,中間一條分隔線;桌機仍為上下堆疊
        <div className="flex min-h-0 flex-1 flex-row md:flex-col">
          {/* 手機專屬:左側標籤欄(桌機隱藏,標籤在標題下方)。
              shrink-0 鎖住寬度,否則右側動作卡的最小寬度會把它擠扁。 */}
          <div className="flex w-2/5 shrink-0 flex-col items-start gap-1.5 overflow-y-auto border-r border-line p-3 md:hidden">
            {filterChips}
          </div>

          {/* 動作清單(min-w-0:允許收縮,內容過長改截斷而非撐開欄位) */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="px-4 pt-3 pb-1 text-xs text-ink-3 sm:px-5">
              <span className="tabular-nums text-ink-2">{exercises.length}</span>{' '}
              / {all.length} {t('exercisesUnit')}
            </div>
            <ul
              className="flex-1 space-y-2 overflow-y-auto px-3 pt-1 sm:px-4"
              /* 底部留出 home indicator 的 safe area,最後一張卡不被遮 */
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {exercises.length === 0 && (
                <li className="px-1 py-6 text-center text-sm text-ink-3">
                  {t('noMatch')}
                </li>
              )}
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  ex={ex}
                  favorited={isFav(ex.id)}
                  onToggleFav={() => toggleFav(ex.id)}
                  onOpen={() => setOpenEx(ex)}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
