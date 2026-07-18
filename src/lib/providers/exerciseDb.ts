/**
 * Provider: ExerciseDB (hasaneyldrm/exercises-dataset) — MIT,1324 個動作,
 * 附 GIF 動圖、target/secondary 肌肉。動作選擇較現代。
 */
import edbData from '../../data/exercisedb.json'
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

    return ranked.map(
      ({ ex, isPrimary }): NormalizedExercise => ({
        id: ex.id,
        name: ex.name,
        isPrimary,
        equipment: ex.equipment,
        level: null,
        imageUrl: ex.gif ? GIF_BASE + ex.gif : null,
        steps: ex.steps,
        stepsZh: ex.stepsZh ?? [],
      }),
    )
  },
}
