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
  /** 英文原名 */
  name: string
  /** 中文名(台灣健身用語,規則式翻譯) */
  nameZh: string
  /** true = 該肌群是主要目標;false = 輔助 */
  isPrimary: boolean
  /** 主要訓練肌肉(英文原詞;顯示時再依語言翻譯) */
  targetMuscle: string
  /** 同時訓練到的其他肌肉(英文原詞) */
  secondaryMuscles: string[]
  equipment: string | null
  /** 靜態縮圖完整網址(清單用,較輕;沒有 → null) */
  imageUrl: string | null
  /** 動圖 GIF 完整網址(全螢幕燈箱用;沒有 → null) */
  gifUrl: string | null
  /** 各語言的動作步驟,key = 語言碼(en/zh/es/…) */
  stepsByLang: Record<string, string[]>
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
