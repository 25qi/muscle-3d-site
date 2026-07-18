/**
 * providers/types.ts
 *
 * A pluggable exercise-database layer. Each database is one self-contained
 * provider module that maps our 12 muscleIds to its own muscle vocabulary and
 * returns a normalized exercise shape. The Panel renders one tab per provider.
 *
 * 之後想只留一個資料庫:刪掉其他 provider 檔 + 從 providers/index.ts 的陣列移除即可。
 */

export interface NormalizedExercise {
  id: string
  name: string
  /** true = 該肌群是主要目標;false = 輔助 */
  isPrimary: boolean
  /** 這個動作主要訓練的肌肉(中文) */
  targetMuscle: string
  /** 這個動作同時訓練到的其他肌肉(中文) */
  secondaryMuscles: string[]
  equipment: string | null
  /** 難度(有些資料庫沒有 → null) */
  level: string | null
  /** 縮圖/動圖完整網址(沒有 → null) */
  imageUrl: string | null
  /** 動作步驟(英文) */
  steps: string[]
  /** 動作步驟(中文,對應 steps 同索引;沒有 → 空陣列) */
  stepsZh: string[]
}

export interface ExerciseProvider {
  /** 內部 id(穩定,用於 tab key) */
  id: string
  /** tab 顯示名稱 */
  label: string
  /** 授權標註(顯示在清單底部) */
  license: string
  /** 給定 muscleId,回傳排序後的正規化動作清單 */
  forMuscle(muscleId: string): NormalizedExercise[]
  /** 依動作 id 取單筆(給「我的最愛」用);找不到回 null */
  byId(id: string): NormalizedExercise | null
}
