import { useT } from '../lib/i18n'

interface FavoriteStarProps {
  favorited: boolean
  onToggle: () => void
  /** 圖示尺寸(Tailwind 字級 class) */
  size?: string
  className?: string
}

/** 收藏星號:已收藏為主色實心 ★,未收藏為灰色空心 ☆。 */
export function FavoriteStar({
  favorited,
  onToggle,
  size = 'text-lg',
  className = '',
}: FavoriteStarProps) {
  const t = useT()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={favorited ? t('removeFav') : t('addFav')}
      className={`flex-none leading-none transition-colors ${size} ${
        favorited ? 'text-accent' : 'text-ink-3 hover:text-accent'
      } ${className}`}
    >
      {favorited ? '★' : '☆'}
    </button>
  )
}
