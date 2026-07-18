import { createContext, useContext, useEffect, useState } from 'react'

/** 提供的語言(繁中/英 + 有翻譯把握的歐語) */
export type Lang = 'en' | 'zh' | 'es' | 'fr' | 'it' | 'pl' | 'tr'

/** 介面/肌肉名只有中英兩版:中文選中文,其餘一律英文 */
export type UiLang = 'en' | 'zh'
export const uiLangOf = (lang: Lang): UiLang => (lang === 'zh' ? 'zh' : 'en')

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
  resetView: { en: 'Reset view', zh: '回正面視角' },
  brand: { en: '3D Muscle Explorer', zh: '肌肉圖鑑 · 3D Muscle Explorer' },
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
  trains: { en: 'Trains', zh: '訓練分類' },
  favOnly: { en: 'Favorites', zh: '只看最愛' },
  primaryOnly: { en: 'Primary only', zh: '只看主要' },
  primary: { en: 'Primary', zh: '主要' },
  secondary: { en: 'Secondary', zh: '輔助' },
  noMatch: { en: 'No exercises match', zh: '沒有符合篩選的動作' },
  savedCount: { en: 'saved exercises', zh: '個收藏動作' },
  favEmpty: {
    en: 'No favorites yet. Tap the ☆ on any exercise to save it — favorites stay in this browser.',
    zh: '還沒有收藏。點任何動作卡右側的 ☆ 就能加入,收藏會留在這個瀏覽器。',
  },
  close: { en: 'Close', zh: '關閉' },
  addFav: { en: 'Add to favorites', zh: '加入最愛' },
  removeFav: { en: 'Remove from favorites', zh: '移除最愛' },
  noGif: { en: 'No demo animation', zh: '無示範動圖' },
  overlapHere: { en: 'overlapping muscles here', zh: '塊重疊肌肉,你想選哪個?' },
  exercisesUnit: { en: 'exercises', zh: '個動作' },
  feedback: { en: 'Feedback', zh: '留言' },
  feedbackTitle: { en: 'Leave feedback', zh: '給作者留言' },
  feedbackHint: {
    en: 'Suggestions to improve this site — public, signed in with GitHub.',
    zh: '給這個網站的改進建議(公開,使用 GitHub 帳號留言)。',
  },
} satisfies Record<string, Record<UiLang, string>>

export type StrKey = keyof typeof STR

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
}
const LangContext = createContext<LangCtx>({ lang: 'zh', setLang: () => {} })

const STORAGE_KEY = 'muscle3d.lang'

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as Lang | null
      return v && LANGS.some((l) => l.code === v) ? v : 'zh'
    } catch {
      return 'zh'
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

export const useLang = () => useContext(LangContext)
export const useUiLang = (): UiLang => uiLangOf(useContext(LangContext).lang)

/** 取介面字串(依目前語言的中/英) */
export function useT() {
  const ui = useUiLang()
  return (key: StrKey) => STR[key][ui]
}
