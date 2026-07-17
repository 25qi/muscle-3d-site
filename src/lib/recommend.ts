/**
 * recommend.ts
 *
 * 把點到的 GLB mesh 名稱解析成訓練肌群。動作清單的查詢/排序已移到
 * src/lib/providers/(每個資料庫一個 provider)。
 */
import { MUSCLE_MAP, type MuscleDef } from '../data/muscleMap'

/**
 * Resolve a GLB mesh name to its training muscle group.
 * three.js 載入時會把名字空格換成底線,比對前先換回空格;找不到回 null。
 */
export function resolveMuscle(meshName: string): MuscleDef | null {
  const n = meshName.toLowerCase().replace(/_/g, ' ')
  return MUSCLE_MAP.find((m) => m.meshPatterns.some((p) => n.includes(p))) ?? null
}
