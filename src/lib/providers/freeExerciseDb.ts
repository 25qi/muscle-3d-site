/**
 * Provider: free-exercise-db (yuhonas) — 目前預設庫,Public Domain。
 * ~873 個動作,muscle 標到「chest / lats / traps / middle back ...」層級。
 */
import exercisesData from '../../data/exercises.json'
import { MUSCLE_MAP } from '../../data/muscleMap'
import type { ExerciseProvider, NormalizedExercise } from './types'

interface RawExercise {
  name: string
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  images: string[]
  id: string
}

const exercises = exercisesData as unknown as RawExercise[]
const IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const LEVEL_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
}

// muscleId -> free-exercise-db 的 muscle 字串
const dbMusclesOf = (muscleId: string): string[] =>
  MUSCLE_MAP.find((m) => m.id === muscleId)?.dbMuscles ?? []

export const freeExerciseDbProvider: ExerciseProvider = {
  id: 'free-exercise-db',
  label: 'free-exercise-db',
  license: 'Public Domain',
  forMuscle(muscleId) {
    const targets = new Set(dbMusclesOf(muscleId))
    if (targets.size === 0) return []

    const ranked = exercises
      .map((ex) => {
        const isPrimary = ex.primaryMuscles.some((m) => targets.has(m))
        const isSecondary = ex.secondaryMuscles.some((m) => targets.has(m))
        return { ex, isPrimary, isSecondary }
      })
      .filter((r) => r.isPrimary || r.isSecondary)

    ranked.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
      const am = a.ex.mechanic === 'compound' ? 0 : 1
      const bm = b.ex.mechanic === 'compound' ? 0 : 1
      if (am !== bm) return am - bm
      return (LEVEL_ORDER[a.ex.level] ?? 9) - (LEVEL_ORDER[b.ex.level] ?? 9)
    })

    return ranked.map(
      ({ ex, isPrimary }): NormalizedExercise => ({
        id: ex.id,
        name: ex.name,
        isPrimary,
        equipment: ex.equipment,
        level: ex.level,
        imageUrl: ex.images[0] ? IMAGE_BASE + ex.images[0] : null,
        steps: ex.instructions,
      }),
    )
  },
}
