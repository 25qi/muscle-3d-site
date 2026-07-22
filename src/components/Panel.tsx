import { useEffect, useMemo, useState } from 'react'
import { type MuscleDef, groupLabel } from '../data/muscleMap'
import { muscleNameEn, muscleNameZh } from '../data/muscleNameZh'
import { muscleTerm } from '../data/muscleTerms'
import { PROVIDERS, type NormalizedExercise } from '../lib/providers'
import { useLang, useT, useUiLang } from '../lib/i18n'
import { ExerciseModal } from './ExerciseModal'

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
    <li className="overflow-hidden rounded-xl border border-line bg-surface-2 transition-colors hover:border-ink-3/40">
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          onClick={onOpen}
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
                  {en ? ex.equipment : equipZh(ex.equipment)}
                </span>
              )}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleFav}
          aria-label={favorited ? t('removeFav') : t('addFav')}
          className={
            'flex-none px-1 text-lg leading-none transition-colors ' +
            (favorited ? 'text-accent' : 'text-ink-3 hover:text-accent')
          }
        >
          {favorited ? '★' : '☆'}
        </button>
      </div>
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
                      <button
                        type="button"
                        onClick={() => toggleFavMuscle(m.base)}
                        aria-label={t('removeFav')}
                        className="flex-none px-1 text-lg leading-none text-accent transition-colors hover:text-ink-3"
                      >
                        ★
                      </button>
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-3xl text-accent ring-1 ring-accent/30">
          ✛
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

  return (
    <div className="flex h-full flex-col">
      {modal}
      <div className="border-b border-line p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-ink capitalize sm:text-2xl">
            {primaryName}
          </h2>
          {/* 收藏這塊肌肉 */}
          <button
            type="button"
            onClick={() => toggleFavMuscle(baseKey)}
            aria-label={muscleFaved ? t('removeFav') : t('addFav')}
            className={
              'flex-none px-1 text-2xl leading-none transition-colors ' +
              (muscleFaved ? 'text-accent' : 'text-ink-3 hover:text-accent')
            }
          >
            {muscleFaved ? '★' : '☆'}
          </button>
        </div>
        {secondaryName && (
          <div className="mt-0.5 text-xs tracking-wide text-ink-3 capitalize">
            {secondaryName}
          </div>
        )}

        {muscle ? (
          <>
            <div className="mt-3">
              {/* 與下方篩選 chip 同規格(圓角/內距/字級) */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-accent/40">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {groupLabel(muscle, lang)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
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
                  {en ? e : equipZh(e)}
                </button>
              ))}
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
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-5 pt-3 pb-1 text-xs text-ink-3">
            <span className="tabular-nums text-ink-2">{exercises.length}</span>{' '}
            / {all.length} {t('exercisesUnit')}
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto px-4 pt-1 pb-4">
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
      )}
    </div>
  )
}
