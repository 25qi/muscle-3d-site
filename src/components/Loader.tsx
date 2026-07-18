import { Html, useProgress } from '@react-three/drei'

/** Suspense fallback shown while the GLB streams in. */
export function Loader({ label = '載入肌肉模型…' }: { label?: string }) {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex w-40 flex-col items-center gap-3 text-ink-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        <div className="text-sm tabular-nums">
          {label} {Math.round(progress)}%
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  )
}
