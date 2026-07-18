/**
 * Provider: ExerciseDB (hasaneyldrm/exercises-dataset) — MIT,1324 個動作,
 * 附 GIF 動圖、target/secondary 肌肉。動作選擇較現代。
 */
import edbData from '../../data/exercisedb.json'
import { exerciseNameZh } from '../../data/exerciseNameZh'
import type { ExerciseProvider, NormalizedExercise } from './types'

interface RawEdb {
  id: string
  name: string
  target: string
  secondary: string[]
  equipment: string | null
  bodyPart: string
  gif: string
  steps: Record<string, string[]>
}

const exercises = edbData as unknown as RawEdb[]
const byIdMap = new Map(exercises.map((e) => [e.id, e]))
const GIF_BASE =
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/'

// muscleId -> ExerciseDB 的 target 字串
const TARGETS: Record<string, string[]> = {
  chest: ['pectorals', 'serratus anterior'],
  lats: ['lats'],
  traps: ['traps', 'upper back', 'levator scapulae'],
  shoulders: ['delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  abs: ['abs'],
  glutes: ['glutes'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
}

// 次要肌肉去掉與主要重複的(保留英文原詞,顯示時再翻譯)
function dedupeSecondary(target: string, secondary: string[]): string[] {
  const seen = new Set<string>([target])
  const out: string[] = []
  for (const m of secondary ?? []) {
    if (seen.has(m)) continue
    seen.add(m)
    out.push(m)
  }
  return out
}

function normalize(ex: RawEdb, isPrimary: boolean): NormalizedExercise {
  return {
    id: ex.id,
    name: ex.name,
    nameZh: exerciseNameZh(ex.name),
    isPrimary,
    targetMuscle: ex.target,
    secondaryMuscles: dedupeSecondary(ex.target, ex.secondary),
    equipment: ex.equipment,
    // 靜態縮圖(images/xxx.jpg)由 GIF 路徑(videos/xxx.gif)推導,不需另存欄位
    imageUrl: ex.gif
      ? GIF_BASE + ex.gif.replace('videos/', 'images/').replace('.gif', '.jpg')
      : null,
    gifUrl: ex.gif ? GIF_BASE + ex.gif : null,
    stepsByLang: ex.steps ?? {},
  }
}

export const exerciseDbProvider: ExerciseProvider = {
  id: 'exercisedb',
  label: 'ExerciseDB',
  license: 'MIT · hasaneyldrm',
  forMuscle(muscleId) {
    const targets = new Set(TARGETS[muscleId] ?? [])
    if (targets.size === 0) return []

    const ranked = exercises
      .map((ex) => {
        const isPrimary = targets.has(ex.target)
        const isSecondary = (ex.secondary ?? []).some((m) => targets.has(m))
        return { ex, isPrimary, isSecondary }
      })
      .filter((r) => r.isPrimary || r.isSecondary)

    // ExerciseDB 沒有 level/mechanic,主要優先 → 名稱排序
    ranked.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
      return a.ex.name.localeCompare(b.ex.name)
    })

    return ranked.map(({ ex, isPrimary }) => normalize(ex, isPrimary))
  },
  byId(id) {
    const ex = byIdMap.get(id)
    return ex ? normalize(ex, true) : null
  },
}
