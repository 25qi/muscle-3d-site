/**
 * muscleTerms.ts
 * ExerciseDB 的 target / secondary 肌肉詞彙 → 多語。
 * zh = 台灣健身用語;es/fr/it/pl/tr = 歐語常見健身用法。
 * 缺該語言 → fallback 英文原詞(en/ru/ko/hi 一律用英文原詞)。
 */
import type { Lang } from '../lib/i18n'

type Tr = Partial<Record<Lang, string>>

const TERMS: Record<string, Tr> = {
  // ── target(主要)──
  pectorals: { zh: '胸肌', es: 'Pectorales', fr: 'Pectoraux', it: 'Pettorali', pl: 'Klatka piersiowa', tr: 'Göğüs' },
  lats: { zh: '闊背肌', es: 'Dorsales', fr: 'Grand dorsal', it: 'Dorsali', pl: 'Najszerszy grzbietu', tr: 'Kanat kasları' },
  traps: { zh: '斜方肌', es: 'Trapecio', fr: 'Trapèzes', it: 'Trapezio', pl: 'Czworoboczny', tr: 'Trapez' },
  'upper back': { zh: '上背', es: 'Espalda alta', fr: 'Haut du dos', it: 'Schiena alta', pl: 'Górna część pleców', tr: 'Üst sırt' },
  delts: { zh: '三角肌', es: 'Deltoides', fr: 'Deltoïdes', it: 'Deltoidi', pl: 'Barki', tr: 'Omuz (deltoid)' },
  biceps: { zh: '二頭肌', es: 'Bíceps', fr: 'Biceps', it: 'Bicipiti', pl: 'Biceps', tr: 'Biceps' },
  triceps: { zh: '三頭肌', es: 'Tríceps', fr: 'Triceps', it: 'Tricipiti', pl: 'Triceps', tr: 'Triceps' },
  forearms: { zh: '前臂', es: 'Antebrazos', fr: 'Avant-bras', it: 'Avambracci', pl: 'Przedramiona', tr: 'Ön kol' },
  abs: { zh: '腹肌', es: 'Abdominales', fr: 'Abdominaux', it: 'Addominali', pl: 'Brzuch', tr: 'Karın' },
  glutes: { zh: '臀肌', es: 'Glúteos', fr: 'Fessiers', it: 'Glutei', pl: 'Pośladki', tr: 'Kalça' },
  quads: { zh: '股四頭肌', es: 'Cuádriceps', fr: 'Quadriceps', it: 'Quadricipiti', pl: 'Czworogłowy uda', tr: 'Ön bacak (quadriceps)' },
  hamstrings: { zh: '腿後肌', es: 'Isquiotibiales', fr: 'Ischio-jambiers', it: 'Femorali', pl: 'Dwugłowy uda', tr: 'Arka bacak (hamstring)' },
  calves: { zh: '小腿', es: 'Gemelos', fr: 'Mollets', it: 'Polpacci', pl: 'Łydki', tr: 'Baldır' },
  abductors: { zh: '外展肌', es: 'Abductores', fr: 'Abducteurs', it: 'Abduttori', pl: 'Odwodziciele', tr: 'Abdüktörler' },
  adductors: { zh: '內收肌', es: 'Aductores', fr: 'Adducteurs', it: 'Adduttori', pl: 'Przywodziciele', tr: 'Addüktörler' },
  'serratus anterior': { zh: '前鋸肌', es: 'Serrato anterior', fr: 'Dentelé antérieur', it: 'Dentato anteriore', pl: 'Zębaty przedni', tr: 'Serratus anterior' },
  'levator scapulae': { zh: '提肩胛肌', es: 'Elevador de la escápula', fr: "Élévateur de la scapula", it: 'Elevatore della scapola', pl: 'Dźwigacz łopatki', tr: 'Levator skapula' },
  spine: { zh: '脊椎', es: 'Columna', fr: 'Colonne vertébrale', it: 'Colonna', pl: 'Kręgosłup', tr: 'Omurga' },
  'cardiovascular system': { zh: '心肺', es: 'Cardio', fr: 'Cardio', it: 'Cardio', pl: 'Układ krążenia', tr: 'Kardiyo' },

  // ── secondary(常見)──
  abdominals: { zh: '腹肌', es: 'Abdominales', fr: 'Abdominaux', it: 'Addominali', pl: 'Brzuch', tr: 'Karın' },
  chest: { zh: '胸', es: 'Pecho', fr: 'Poitrine', it: 'Petto', pl: 'Klatka', tr: 'Göğüs' },
  'upper chest': { zh: '上胸', es: 'Pecho superior', fr: 'Haut des pectoraux', it: 'Petto alto', pl: 'Górna klatka', tr: 'Üst göğüs' },
  shoulders: { zh: '肩', es: 'Hombros', fr: 'Épaules', it: 'Spalle', pl: 'Barki', tr: 'Omuz' },
  deltoids: { zh: '三角肌', es: 'Deltoides', fr: 'Deltoïdes', it: 'Deltoidi', pl: 'Barki', tr: 'Deltoid' },
  'rear deltoids': { zh: '後三角肌', es: 'Deltoides posterior', fr: 'Deltoïde postérieur', it: 'Deltoide posteriore', pl: 'Tylny akton barku', tr: 'Arka omuz' },
  'rotator cuff': { zh: '旋轉肌群', es: 'Manguito rotador', fr: 'Coiffe des rotateurs', it: 'Cuffia dei rotatori', pl: 'Stożek rotatorów', tr: 'Rotator manşet' },
  back: { zh: '背部', es: 'Espalda', fr: 'Dos', it: 'Schiena', pl: 'Plecy', tr: 'Sırt' },
  'lower back': { zh: '下背', es: 'Zona lumbar', fr: 'Bas du dos', it: 'Zona lombare', pl: 'Dolna część pleców', tr: 'Bel' },
  'latissimus dorsi': { zh: '闊背肌', es: 'Dorsal ancho', fr: 'Grand dorsal', it: 'Gran dorsale', pl: 'Najszerszy grzbietu', tr: 'Latissimus dorsi' },
  rhomboids: { zh: '菱形肌', es: 'Romboides', fr: 'Rhomboïdes', it: 'Romboidi', pl: 'Równoległoboczne', tr: 'Romboid' },
  trapezius: { zh: '斜方肌', es: 'Trapecio', fr: 'Trapèze', it: 'Trapezio', pl: 'Czworoboczny', tr: 'Trapez' },
  core: { zh: '核心', es: 'Core', fr: 'Gainage', it: 'Core', pl: 'Mięśnie głębokie', tr: 'Kor' },
  obliques: { zh: '腹斜肌', es: 'Oblicuos', fr: 'Obliques', it: 'Obliqui', pl: 'Skośne brzucha', tr: 'Yan karın (oblik)' },
  'lower abs': { zh: '下腹', es: 'Abdomen inferior', fr: 'Bas des abdominaux', it: 'Addome basso', pl: 'Dolny brzuch', tr: 'Alt karın' },
  'hip flexors': { zh: '髖屈肌', es: 'Flexores de cadera', fr: 'Fléchisseurs de la hanche', it: "Flessori dell'anca", pl: 'Zginacze bioder', tr: 'Kalça fleksörleri' },
  quadriceps: { zh: '股四頭肌', es: 'Cuádriceps', fr: 'Quadriceps', it: 'Quadricipiti', pl: 'Czworogłowy uda', tr: 'Quadriceps' },
  'inner thighs': { zh: '大腿內側', es: 'Cara interna del muslo', fr: 'Face interne des cuisses', it: 'Interno coscia', pl: 'Wewnętrzna część uda', tr: 'İç uyluk' },
  soleus: { zh: '比目魚肌', es: 'Sóleo', fr: 'Soléaire', it: 'Soleo', pl: 'Płaszczkowaty', tr: 'Soleus' },
  brachialis: { zh: '肱肌', es: 'Braquial', fr: 'Brachial', it: 'Brachiale', pl: 'Ramienny', tr: 'Brakialis' },
  'wrist flexors': { zh: '屈腕肌', es: 'Flexores de muñeca', fr: 'Fléchisseurs du poignet', it: 'Flessori del polso', pl: 'Zginacze nadgarstka', tr: 'Bilek fleksörleri' },
  'wrist extensors': { zh: '伸腕肌', es: 'Extensores de muñeca', fr: 'Extenseurs du poignet', it: 'Estensori del polso', pl: 'Prostowniki nadgarstka', tr: 'Bilek ekstansörleri' },
  wrists: { zh: '腕', es: 'Muñecas', fr: 'Poignets', it: 'Polsi', pl: 'Nadgarstki', tr: 'Bilekler' },
  groin: { zh: '鼠蹊', es: 'Ingle', fr: 'Aine', it: 'Inguine', pl: 'Pachwina', tr: 'Kasık' },
  shins: { zh: '脛前', es: 'Espinillas', fr: 'Tibias', it: 'Tibia', pl: 'Piszczele', tr: 'Kaval kemiği' },
  hands: { zh: '手', es: 'Manos', fr: 'Mains', it: 'Mani', pl: 'Dłonie', tr: 'Eller' },
  feet: { zh: '足', es: 'Pies', fr: 'Pieds', it: 'Piedi', pl: 'Stopy', tr: 'Ayaklar' },
  ankles: { zh: '踝', es: 'Tobillos', fr: 'Chevilles', it: 'Caviglie', pl: 'Kostki', tr: 'Ayak bilekleri' },
  sternocleidomastoid: { zh: '胸鎖乳突肌' },
  'grip muscles': { zh: '握力肌', es: 'Agarre', fr: 'Grip', it: 'Presa', pl: 'Chwyt', tr: 'Kavrama' },
  'ankle stabilizers': { zh: '踝穩定肌' },
}

/** 依語言取肌肉詞(缺該語言 → 英文原詞) */
export function muscleTerm(term: string, lang: Lang): string {
  return TERMS[term]?.[lang] ?? term
}
