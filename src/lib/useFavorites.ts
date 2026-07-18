import { useCallback, useEffect, useState } from 'react'

/**
 * 我的最愛(存在瀏覽器 localStorage,重新整理/關閉再開都保留)。
 * 存的是動作的 id 集合;純前端、免登入、免後端。
 */
const STORAGE_KEY = 'muscle3d.favorites'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(load)

  // 每次變動就寫回 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
    } catch {
      // 私密模式等無法寫入時忽略
    }
  }, [favorites])

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
