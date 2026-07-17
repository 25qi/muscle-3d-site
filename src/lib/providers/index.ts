/**
 * 資料庫 provider 清單。陣列順序 = Panel 分頁順序。
 * 要新增/移除資料庫,只需在這裡增刪一行(並刪對應的 provider 檔)。
 */
import type { ExerciseProvider } from './types'
import { freeExerciseDbProvider } from './freeExerciseDb'
import { exerciseDbProvider } from './exerciseDb'

export type { ExerciseProvider, NormalizedExercise } from './types'

export const PROVIDERS: ExerciseProvider[] = [
  freeExerciseDbProvider,
  exerciseDbProvider,
]
