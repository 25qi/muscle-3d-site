import type { Lang } from '../lib/i18n'

/**
 * muscleMap.ts
 *
 * The taxonomy bridge of this project: it connects three naming systems that
 * do NOT agree with each other.
 *
 *   GLB mesh name (467, anatomical)  ->  muscleId (12, training)  ->  free-exercise-db string
 *   "clavicular part of ... deltoid"     "shoulders"                  "shoulders"
 *
 * Matching is done with lowercase substring `includes` against the mesh name.
 * Left/right meshes share one muscleId (the "left"/"right" word is ignored by
 * the substring patterns).
 *
 * Attribution: the keyword groupings below are adapted from
 * JohanBellander/BodyExplorer `src/muscleData.js` (MIT License), then
 * re-grouped from its 14 anatomical regions into the 12 training muscle
 * groups this app targets (e.g. its single BACK region is split into lats vs
 * traps; UPPER_ARM into biceps vs triceps; UPPER_LEG into quads vs hamstrings).
 *
 * ⚠️ Patterns and dbMuscles were verified against public/mesh_mapping.json and
 * src/data/exercises.json: every dbMuscles string exists in the exercise DB,
 * and no mesh is claimed by two groups.
 */

export interface MuscleDef {
  /** internal muscleId */
  id: string;
  /** display label (Traditional Chinese) */
  labelZh: string;
  /** a mesh whose lowercased name includes any of these belongs to this group */
  meshPatterns: string[];
  /** matching muscle strings in free-exercise-db (primaryMuscles/secondaryMuscles) */
  dbMuscles: string[];
}

export const MUSCLE_MAP: MuscleDef[] = [
  {
    id: 'chest',
    labelZh: '胸',
    // "pectoralis" 同時涵蓋 major(3 部位)與 minor
    meshPatterns: ['pectoralis'],
    dbMuscles: ['chest'],
  },
  {
    id: 'lats',
    labelZh: '闊背肌',
    meshPatterns: ['latissimus'],
    dbMuscles: ['lats'],
  },
  {
    id: 'traps',
    labelZh: '斜方肌',
    // 訓練上斜方與菱形肌一起練，對到 db 的 traps + middle back
    meshPatterns: ['trapezius', 'rhomboid'],
    dbMuscles: ['traps', 'middle back'],
  },
  {
    id: 'shoulders',
    labelZh: '肩',
    // 只取三角肌(前中後束);旋轉肌群暫不納入(見檔尾待確認清單)
    meshPatterns: ['deltoid'],
    dbMuscles: ['shoulders'],
  },
  {
    id: 'biceps',
    labelZh: '二頭',
    // "brachialis" 也會命中 coracobrachialis(喙肱肌),訓練上歸二頭區無妨
    meshPatterns: ['biceps brachii', 'brachialis'],
    dbMuscles: ['biceps'],
  },
  {
    id: 'triceps',
    labelZh: '三頭',
    meshPatterns: ['triceps brachii'],
    dbMuscles: ['triceps'],
  },
  {
    id: 'forearms',
    labelZh: '前臂',
    // 前臂屈伸肌群 + 旋前/旋後 + 肱橈肌
    meshPatterns: [
      'brachioradialis',
      'pronator',
      'supinator',
      'flexor carpi',
      'extensor carpi',
      'palmaris',
      'extensor pollicis',
      'extensor indicis',
      'extensor digiti minimi',
    ],
    dbMuscles: ['forearms'],
  },
  {
    id: 'abs',
    labelZh: '腹',
    meshPatterns: [
      'rectus abdominis',
      'external oblique',
      'internal oblique',
      'transversus abdominis',
    ],
    dbMuscles: ['abdominals'],
  },
  {
    id: 'glutes',
    labelZh: '臀',
    // gluteus maximus / medius / minimus
    meshPatterns: ['gluteus'],
    dbMuscles: ['glutes'],
  },
  {
    id: 'quads',
    labelZh: '股四頭',
    // rectus femoris + vastus lateralis/medialis/intermedius
    meshPatterns: ['rectus femoris', 'vastus'],
    dbMuscles: ['quadriceps'],
  },
  {
    id: 'hamstrings',
    labelZh: '腿後',
    meshPatterns: ['biceps femoris', 'semitendinosus', 'semimembranosus'],
    dbMuscles: ['hamstrings'],
  },
  {
    id: 'calves',
    labelZh: '小腿',
    // 腓腸肌 + 比目魚肌 + 蹠肌(不含脛前肌/腓骨肌)
    meshPatterns: ['gastrocnemius', 'soleus', 'plantaris'],
    dbMuscles: ['calves'],
  },
];

// 12 訓練肌群各語言標籤;缺該語言 → 英文(en/ru/ko/hi 用英文)
type GroupTr = Partial<Record<Lang, string>>
const GROUP_LABELS: Record<string, GroupTr> = {
  chest: { en: 'Chest', es: 'Pecho', fr: 'Pectoraux', it: 'Petto', pl: 'Klatka', tr: 'Göğüs' },
  lats: { en: 'Lats', es: 'Dorsales', fr: 'Grand dorsal', it: 'Dorsali', pl: 'Najszersze', tr: 'Kanat' },
  traps: { en: 'Traps', es: 'Trapecio', fr: 'Trapèzes', it: 'Trapezio', pl: 'Czworoboczny', tr: 'Trapez' },
  shoulders: { en: 'Shoulders', es: 'Hombros', fr: 'Épaules', it: 'Spalle', pl: 'Barki', tr: 'Omuz' },
  biceps: { en: 'Biceps', es: 'Bíceps', fr: 'Biceps', it: 'Bicipiti', pl: 'Biceps', tr: 'Biceps' },
  triceps: { en: 'Triceps', es: 'Tríceps', fr: 'Triceps', it: 'Tricipiti', pl: 'Triceps', tr: 'Triceps' },
  forearms: { en: 'Forearms', es: 'Antebrazos', fr: 'Avant-bras', it: 'Avambracci', pl: 'Przedramiona', tr: 'Ön kol' },
  abs: { en: 'Abs', es: 'Abdominales', fr: 'Abdominaux', it: 'Addominali', pl: 'Brzuch', tr: 'Karın' },
  glutes: { en: 'Glutes', es: 'Glúteos', fr: 'Fessiers', it: 'Glutei', pl: 'Pośladki', tr: 'Kalça' },
  quads: { en: 'Quads', es: 'Cuádriceps', fr: 'Quadriceps', it: 'Quadricipiti', pl: 'Czworogłowy', tr: 'Quadriceps' },
  hamstrings: { en: 'Hamstrings', es: 'Isquiotibiales', fr: 'Ischio-jambiers', it: 'Femorali', pl: 'Dwugłowy uda', tr: 'Hamstring' },
  calves: { en: 'Calves', es: 'Gemelos', fr: 'Mollets', it: 'Polpacci', pl: 'Łydki', tr: 'Baldır' },
}

/** 依語言取肌群標籤(zh → 中文;其餘查表,缺 → 英文) */
export const groupLabel = (m: MuscleDef, lang: Lang): string =>
  lang === 'zh' ? m.labelZh : (GROUP_LABELS[m.id]?.[lang] ?? m.id)
