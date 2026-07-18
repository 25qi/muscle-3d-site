/**
 * 資料庫 provider 清單。陣列順序 = Panel 分頁順序(單一 provider 時不顯示分頁)。
 * 要新增資料庫:加一個 provider 檔 + 在這裡增一行。
 */
import type { ExerciseProvider } from './types'
import { exerciseDbProvider } from './exerciseDb'

export type { ExerciseProvider, NormalizedExercise } from './types'

export const PROVIDERS: ExerciseProvider[] = [exerciseDbProvider]
