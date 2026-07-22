/**
 * icons.tsx
 * 頂部工具列用的單色線條圖示(同一風格、stroke 繼承文字顏色)。
 * 路徑取自 Lucide(ISC License, https://lucide.dev)。
 */
import type { SVGProps } from 'react'

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

/** ☰ 清單 */
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </Svg>
)

/** ★ 最愛 */
export const IconStar = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
)

/** 💬 留言 */
export const IconChat = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
)

/** 語言/翻譯(Lucide "languages":字母 A 與筆畫,比地球更明確代表語言) */
export const IconLanguages = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </Svg>
)

/** 透明度(Lucide "blend":兩個交疊的圓,代表透視/疊層) */
export const IconOpacity = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="9" cy="9" r="7" />
    <circle cx="15" cy="15" r="7" />
  </Svg>
)

/** ⟲ 正面視角 */
export const IconReset = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </Svg>
)
