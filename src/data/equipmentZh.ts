/**
 * equipmentZh.ts
 * ExerciseDB 的 equipment 值 → 中文(Panel 與燈箱共用,避免各自維護一份)。
 */
const EQUIP_ZH: Record<string, string> = {
  'body weight': '徒手',
  dumbbell: '啞鈴',
  cable: '滑輪',
  barbell: '槓鈴',
  'leverage machine': '槓桿機',
  band: '彈力帶',
  'smith machine': '史密斯機',
  kettlebell: '壺鈴',
  weighted: '負重',
  'stability ball': '抗力球',
  'ez barbell': 'EZ 槓',
  assisted: '輔助',
  'sled machine': '雪橇機',
  'medicine ball': '藥球',
  rope: '繩索',
  roller: '滾輪',
  'resistance band': '阻力帶',
  'bosu ball': 'BOSU 球',
  'olympic barbell': '奧林匹克槓',
  'trap bar': '六角槓',
}

/** 依介面語言取器材名(英文介面用原詞) */
export const equipmentLabel = (e: string, en: boolean): string =>
  en ? e : (EQUIP_ZH[e] ?? e)
