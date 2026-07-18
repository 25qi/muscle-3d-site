/**
 * Provider: ExerciseDB (hasaneyldrm/exercises-dataset) — MIT,1324 個動作,
 * 附 GIF 動圖、target/secondary 肌肉。動作選擇較現代。
 */
import edbData from '../../data/exercisedb.json'
import { muscleTermZh } from '../../data/muscleTermZh'
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
  steps: string[]
  stepsZh: string[]
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

// 次要肌肉去掉與主要重複的,並轉中文
function secondaryZh(target: string, secondary: string[]): string[] {
  const seen = new Set<string>([muscleTermZh(target)])
  const out: string[] = []
  for (const m of secondary ?? []) {
    const zh = muscleTermZh(m)
    if (seen.has(zh)) continue
    seen.add(zh)
    out.push(zh)
  }
  return out
}

function normalize(ex: RawEdb, isPrimary: boolean): NormalizedExercise {
  return {
    id: ex.id,
    name: ex.name,
    nameZh: exerciseNameZh(ex.name),
    isPrimary,
    targetMuscle: muscleTermZh(ex.target),
    secondaryMuscles: secondaryZh(ex.target, ex.secondary),
    equipment: ex.equipment,
    level: null,
    imageUrl: ex.gif ? GIF_BASE + ex.gif : null,
    steps: ex.steps,
    stepsZh: ex.stepsZh ?? [],
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
