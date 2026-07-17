/**
 * recommend.ts
 *
 * The query layer: clicked mesh name -> muscle group -> ranked exercise list.
 *
 *   resolveMuscle(meshName)  finds the MuscleDef whose meshPatterns match
 *   recommend(muscleDef)     filters + ranks free-exercise-db exercises
 */

import exercisesData from '../data/exercises.json'
import { MUSCLE_MAP, type MuscleDef } from '../data/muscleMap'

export interface Exercise {
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
  id: string
}

/** free-exercise-db hosts exercise images under this path. */
export const IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export const exercises = exercisesData as unknown as Exercise[]

/**
 * Resolve a GLB mesh name to its training muscle group.
 * 用小寫子字串比對 meshPatterns;找不到回 null(UI 顯示「尚未支援」)。
 */
export function resolveMuscle(meshName: string): MuscleDef | null {
  // three.js 載入時會把名字空格換成底線,比對前先換回空格
  const n = meshName.toLowerCase().replace(/_/g, ' ')
  return MUSCLE_MAP.find((m) => m.meshPatterns.some((p) => n.includes(p))) ?? null
}

export interface RankedExercise extends Exercise {
  /** true 表示這塊肌肉是該動作的主要訓練目標 */
  isPrimary: boolean
}

// compound 動作優先、難度由淺入深
const LEVEL_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
}

/**
 * Return exercises that train the given muscle group, ranked:
 *   1. primaryMuscles 命中 > secondaryMuscles 命中
 *   2. compound 動作優先於 isolation
 *   3. 難度 beginner -> intermediate -> expert
 */
export function recommend(muscle: MuscleDef): RankedExercise[] {
  const targets = new Set(muscle.dbMuscles)
  const ranked: RankedExercise[] = []

  for (const ex of exercises) {
    const isPrimary = ex.primaryMuscles.some((m) => targets.has(m))
    const isSecondary = ex.secondaryMuscles.some((m) => targets.has(m))
    if (!isPrimary && !isSecondary) continue
    ranked.push({ ...ex, isPrimary })
  }

  ranked.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
    const aCompound = a.mechanic === 'compound' ? 0 : 1
    const bCompound = b.mechanic === 'compound' ? 0 : 1
    if (aCompound !== bCompound) return aCompound - bCompound
    return (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
  })

  return ranked
}
