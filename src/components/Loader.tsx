import { Html, useProgress } from '@react-three/drei'

/** Suspense fallback shown while the GLB streams in. */
export function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-neutral-300">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
        <div className="text-sm tabular-nums">
          載入肌肉模型… {Math.round(progress)}%
        </div>
      </div>
    </Html>
  )
}
