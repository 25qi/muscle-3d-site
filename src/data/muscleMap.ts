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
