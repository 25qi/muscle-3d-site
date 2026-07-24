import { createContext, useContext, useEffect, useState } from 'react'

/** 提供的語言(繁中/英 + 有翻譯把握的歐語) */
export type Lang = 'en' | 'zh' | 'es' | 'fr' | 'it' | 'pl' | 'tr'

/** 介面/肌肉名只有中英兩版:中文選中文,其餘一律英文 */
type UiLang = 'en' | 'zh'
const uiLangOf = (lang: Lang): UiLang => (lang === 'zh' ? 'zh' : 'en')

/** 語言切換選單(以各語言母語顯示) */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'zh', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
]

// 介面字串(每個 key 中英兩版)
const STR = {
  muscles: { en: 'Muscles', zh: '肌肉清單' },
  favorites: { en: 'Favorites', zh: '我的最愛' },
  opacity: { en: 'Opacity', zh: '透明度' },
  resetView: { en: 'Front view', zh: '正面視角' },
  language: { en: 'Language', zh: '語言' },
  loading: { en: 'Loading model…', zh: '載入肌肉模型…' },
  searchMuscles: { en: 'Search muscles', zh: '搜尋肌肉(中/英)' },
  noMuscles: { en: 'No muscles found', zh: '找不到符合的肌肉' },
  unsupported: { en: 'Unsupported', zh: '未支援' },
  notSupportedToast: {
    en: "This muscle isn't supported yet",
    zh: '這塊肌肉尚未支援',
  },
  notSupportedYet: { en: 'Not supported yet', zh: '尚未支援' },
  notSupportedBody: {
    en: 'This muscle is outside the 12 supported training groups, so there are no recommended exercises. You can still browse other muscles from the list.',
    zh: '這塊肌肉不在目前支援的 12 個訓練肌群內,因此沒有推薦動作。你仍可從左側清單瀏覽其他肌肉。',
  },
  exploreTitle: { en: 'Explore muscle groups', zh: '開始探索肌肉群' },
  exploreBody: {
    en: 'Pick a muscle to instantly see the best exercises, equipment and step-by-step guides.',
    zh: '選一塊肌肉,立刻看到最適合訓練它的動作、器材與分解步驟。',
  },
  exploreHint: {
    en: '← Rotate and click the 3D model on the left, or search in “Muscles”.',
    zh: '← 旋轉、點選左側的 3D 模型,或用左上的「肌肉清單」搜尋',
  },
  favOnly: { en: 'Favorites', zh: '只看最愛' },
  primaryOnly: { en: 'Primary only', zh: '只看主要' },
  primary: { en: 'Primary', zh: '主要' },
  secondary: { en: 'Secondary', zh: '輔助' },
  noMatch: { en: 'No exercises match', zh: '沒有符合篩選的動作' },
  savedCount: { en: 'saved items', zh: '個收藏' },
  musclesSection: { en: 'Muscles', zh: '肌肉' },
  exercisesSection: { en: 'Exercises', zh: '動作' },
  favEmpty: {
    en: 'No favorites yet. Tap the ☆ on any exercise to save it. Favorites stay in this browser.',
    zh: '還沒有收藏。點任何動作卡右側的 ☆ 就能加入,收藏會留在這個瀏覽器。',
  },
  close: { en: 'Close', zh: '關閉' },
  addFav: { en: 'Add to favorites', zh: '加入最愛' },
  removeFav: { en: 'Remove from favorites', zh: '移除最愛' },
  noGif: { en: 'No demo animation', zh: '無示範動圖' },
  overlapHere: {
    en: 'overlapping muscles, pick one',
    zh: '塊重疊肌肉,你想選哪個?',
  },
  exercisesUnit: { en: 'exercises', zh: '個動作' },
  feedback: { en: 'Feedback', zh: '回饋' },
  feedbackTitle: { en: 'Leave feedback', zh: '給作者留言' },
  feedbackHint: {
    en: 'Suggestions to improve this site. Public, signed in with GitHub.',
    zh: '給這個網站的改進建議(公開,使用 GitHub 帳號留言)。',
  },
  about: { en: 'About & credits', zh: '關於與授權' },
  aboutSources: { en: 'Sources & credits', zh: '資料來源與授權' },
} satisfies Record<string, Record<UiLang, string>>

/**
 * 《關於》的描述文字。這是「內容」而非介面 chrome,所以支援全部七種語言
 * (介面標籤仍只有中英)。依使用者實際選的語言顯示。
 */
const ABOUT_BODY: Record<Lang, { lead: string; use: string }> = {
  zh: {
    lead: 'Vector 是一個免費的互動式 3D 肌肉探索工具,讓你在運動前更了解自己的肌肉位置,並和重量訓練連結在一起。你可以自由旋轉和移動人體模型,點選任何一塊肌肉,右側就會列出最適合訓練它的動作,每個動作都附上器材、目標與協同肌群、分解步驟和示範動圖 GIF。',
    use: '除了直接點模型,還能用肌肉清單瀏覽,並收藏動作與肌肉,以及切換七種語言。免註冊、免安裝。',
  },
  en: {
    lead: 'Vector is a free, interactive 3D muscle explorer that helps you understand where your muscles are before you train, and connects that to weight training. Freely rotate and move the human body model, click any muscle, and the panel on the right lists the best exercises to train it, each with equipment, target and synergist muscles, step by step instructions and a demo GIF.',
    use: 'Besides clicking the model, you can browse from the muscle list, save exercises and muscles, and switch between seven languages. No signup, no install.',
  },
  es: {
    lead: 'Vector es un explorador muscular 3D interactivo y gratuito que te ayuda a entender dónde están tus músculos antes de entrenar y lo conecta con el entrenamiento de fuerza. Gira y mueve libremente el modelo del cuerpo humano, haz clic en cualquier músculo y el panel de la derecha mostrará los mejores ejercicios para entrenarlo, cada uno con el equipo, los músculos principales y sinergistas, instrucciones paso a paso y un GIF de demostración.',
    use: 'Además de hacer clic en el modelo, puedes explorar desde la lista de músculos, guardar ejercicios y músculos, y cambiar entre siete idiomas. Sin registro, sin instalación.',
  },
  fr: {
    lead: 'Vector est un explorateur musculaire 3D interactif et gratuit qui vous aide à comprendre où se trouvent vos muscles avant de vous entraîner, et le relie à la musculation. Faites pivoter et déplacez librement le modèle du corps humain, cliquez sur n’importe quel muscle, et le panneau de droite affiche les meilleurs exercices pour le travailler, chacun avec le matériel, les muscles ciblés et synergistes, des instructions étape par étape et un GIF de démonstration.',
    use: 'En plus de cliquer sur le modèle, vous pouvez parcourir la liste des muscles, enregistrer des exercices et des muscles, et passer d’une langue à l’autre parmi sept langues. Sans inscription, sans installation.',
  },
  it: {
    lead: 'Vector è un esploratore muscolare 3D interattivo e gratuito che ti aiuta a capire dove si trovano i tuoi muscoli prima di allenarti e lo collega all’allenamento con i pesi. Ruota e sposta liberamente il modello del corpo umano, clicca su qualsiasi muscolo e il pannello a destra elencherà i migliori esercizi per allenarlo, ciascuno con l’attrezzatura, i muscoli target e sinergici, istruzioni passo passo e una GIF dimostrativa.',
    use: 'Oltre a cliccare sul modello, puoi sfogliare l’elenco dei muscoli, salvare esercizi e muscoli e passare tra sette lingue. Senza registrazione, senza installazione.',
  },
  pl: {
    lead: 'Vector to darmowy, interaktywny eksplorator mięśni 3D, który pomaga zrozumieć, gdzie znajdują się Twoje mięśnie przed treningiem, i łączy to z treningiem siłowym. Swobodnie obracaj i przesuwaj model ludzkiego ciała, kliknij dowolny mięsień, a panel po prawej stronie wyświetli najlepsze ćwiczenia do jego trenowania, każde ze sprzętem, mięśniami docelowymi i wspomagającymi, instrukcjami krok po kroku oraz demonstracyjnym GIF-em.',
    use: 'Oprócz klikania modelu możesz przeglądać listę mięśni, zapisywać ćwiczenia i mięśnie oraz przełączać się między siedmioma językami. Bez rejestracji, bez instalacji.',
  },
  tr: {
    lead: 'Vector, antrenmandan önce kaslarınızın nerede olduğunu anlamanıza yardımcı olan ve bunu ağırlık antrenmanıyla ilişkilendiren ücretsiz, etkileşimli bir 3D kas kâşifidir. İnsan vücudu modelini serbestçe döndürüp hareket ettirin, herhangi bir kasa tıklayın; sağdaki panel, onu çalıştırmak için en iyi egzersizleri her biri ekipman, hedef ve yardımcı kaslar, adım adım talimatlar ve bir demo GIF’i ile birlikte listeler.',
    use: 'Modele tıklamanın yanı sıra kas listesinden göz atabilir, egzersizleri ve kasları kaydedebilir ve yedi dil arasında geçiş yapabilirsiniz. Kayıt yok, kurulum yok.',
  },
}

/** 《關於》描述文字(依實際語言,含歐語) */
export const aboutBody = (lang: Lang) => ABOUT_BODY[lang]

type StrKey = keyof typeof STR

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
}
const LangContext = createContext<LangCtx>({ lang: 'zh', setLang: () => {} })

const STORAGE_KEY = 'muscle3d.lang'

/** 華語圈時區:瀏覽器語系完全比不到時,才拿來當地理線索 */
const ZH_TIMEZONES = new Set([
  'Asia/Taipei',
  'Asia/Hong_Kong',
  'Asia/Macau',
  'Asia/Shanghai',
  'Asia/Chongqing',
  'Asia/Harbin',
  'Asia/Urumqi',
  'Asia/Kashgar',
])

/**
 * 首次到訪時猜一個語言。優先序:
 *   1. 瀏覽器語系清單(使用者自己設的,最可信;任何 zh-* 都給繁中)
 *   2. 時區落在華語圈 → 繁中
 *   3. 其餘一律英文
 *
 * 刻意不用 IP 定位:位置不等於語言偏好(在國外的華人、在台灣的外籍人士都會被猜錯),
 * 而且會多一次第三方請求。此函式純本機判斷,不對外連線。
 */
function detectLang(): Lang {
  const supported = new Set<string>(LANGS.map((l) => l.code))
  const tags = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]
  for (const tag of tags) {
    const base = (tag || '').toLowerCase().split('-')[0]
    if (base === 'zh') return 'zh'
    if (supported.has(base)) return base as Lang
  }
  try {
    if (ZH_TIMEZONES.has(Intl.DateTimeFormat().resolvedOptions().timeZone)) {
      return 'zh'
    }
  } catch {
    /* Intl 不可用時忽略,落到英文 */
  }
  return 'en'
}

/** Provides the selected language to the tree and persists it to localStorage. */
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      // 使用者手動選過就一律尊重;沒選過(首次到訪)才自動偵測
      const v = localStorage.getItem(STORAGE_KEY) as Lang | null
      return v && LANGS.some((l) => l.code === v) ? v : detectLang()
    } catch {
      return detectLang()
    }
  })
  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

/** Current language plus its setter. */
export const useLang = () => useContext(LangContext)
/** Language used for chrome and muscle names (Chinese, otherwise English). */
export const useUiLang = (): UiLang => uiLangOf(useContext(LangContext).lang)

/** 取介面字串(依目前語言的中/英) */
export function useT() {
  const ui = useUiLang()
  return (key: StrKey) => STR[key][ui]
}
