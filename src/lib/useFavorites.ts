import { useCallback, useEffect, useState } from 'react'

/**
 * 我的最愛(存在瀏覽器 localStorage,重新整理/關閉再開都保留)。
 * 存的是 id 集合;純前端、免登入、免後端。
 * storageKey 可自訂:動作收藏與肌肉收藏各用一個 key。
 */
const DEFAULT_KEY = 'muscle3d.favorites'

function load(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function useFavorites(storageKey: string = DEFAULT_KEY) {
  const [favorites, setFavorites] = useState<Set<string>>(() => load(storageKey))

  // 每次變動就寫回 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...favorites]))
    } catch {
      // 私密模式等無法寫入時忽略
    }
  }, [favorites, storageKey])

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  return { favorites, toggle, isFavorite }
}
