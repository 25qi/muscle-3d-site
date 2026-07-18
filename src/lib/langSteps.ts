/**
 * langSteps.ts
 * en / zh 的步驟已內建在 exercisedb.json;其他語言首次選到時才 fetch
 * public/steps/<lang>.json(不打包,減少首次載入),載到後快取。
 */
const cache = new Map<string, Record<string, string[]>>()
const loading = new Map<string, Promise<void>>()

export function ensureLang(lang: string): Promise<void> {
  if (lang === 'en' || lang === 'zh' || cache.has(lang)) return Promise.resolve()
  const existing = loading.get(lang)
  if (existing) return existing
  const p = fetch(`/steps/${lang}.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: Record<string, string[]>) => {
      cache.set(lang, data)
    })
    .catch(() => {
      cache.set(lang, {})
    })
  loading.set(lang, p)
  return p
}

/** 取延遲載入語言的步驟(未載入 → undefined) */
export function lazySteps(id: string, lang: string): string[] | undefined {
  return cache.get(lang)?.[id]
}
