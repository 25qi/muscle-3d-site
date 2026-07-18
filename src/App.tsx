import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { AnatomyModel } from './components/AnatomyModel'
import { Loader } from './components/Loader'
import { Panel } from './components/Panel'
import { MuscleList } from './components/MuscleList'
import { muscleNameZh } from './data/muscleNameZh'
import { resolveMuscle } from './lib/recommend'

interface PickList {
  names: string[]
  x: number
  y: number
}

function App() {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [opacity, setOpacity] = useState(1) // 肌肉透明度(1 = 不透明)
  const [showList, setShowList] = useState(false) // 是否顯示可搜尋肌肉清單
  const [pickList, setPickList] = useState<PickList | null>(null) // 游標下多塊重疊時的挑選清單
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  const selectMuscle = (name: string) => {
    setSelectedName(name)
    setPickList(null)
  }

  // 點擊 3D:只有一塊直接選;多塊重疊則跳清單讓使用者挑
  const handlePick = (names: string[], x: number, y: number) => {
    if (names.length === 1) selectMuscle(names[0])
    else setPickList({ names, x, y })
  }

  // 回正面視角:依模型實際包圍盒中心對準,正面水平框好(不會從腳往上看)
  const resetView = () => {
    const group = groupRef.current
    const controls = controlsRef.current
    if (!group || !controls) return
    const box = new THREE.Box3().setFromObject(group)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const cam = controls.object as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180
    // 依身高/身寬算出剛好框滿的距離,再留一點邊界
    const dist = (Math.max(size.y, size.x) / 2 / Math.tan(fov / 2)) * 1.3
    cam.position.set(center.x, center.y, center.z + dist)
    controls.target.copy(center)
    controls.update()
  }

  // 解析選中的 mesh -> 肌群(動作清單由 Panel 依所選資料庫 provider 計算)
  const muscle = useMemo(
    () => (selectedName ? resolveMuscle(selectedName) : null),
    [selectedName],
  )

  // 點到未支援的肌肉時跳提示;選到有支援的、或沒選時,立即清掉提示
  useEffect(() => {
    if (!selectedName || muscle) {
      setToast(null)
      return
    }
    setToast('這塊肌肉尚未支援')
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [selectedName, muscle])

  return (
    <div className="flex h-full w-full flex-col">
      {/* 主區:3D 場景 + 動作面板 */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative h-1/2 w-full bg-neutral-900 md:h-full md:flex-1">
          {/* logarithmicDepthBuffer + 收緊 near/far:大幅降低薄片肌肉重疊處的 z-fighting(破洞/斑駁) */}
          <Canvas
            camera={{ position: [0, 0, 800], fov: 45, near: 20, far: 3500 }}
            gl={{ logarithmicDepthBuffer: true }}
          >
            {/* 多向打光:環境光 + 半球光補底,前/後/側各一盞,旋轉到任何角度都夠亮 */}
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#3a3a44', 0.5]} />
            <directionalLight position={[400, 600, 800]} intensity={1.0} />
            <directionalLight position={[-400, 400, -800]} intensity={0.9} />
            <directionalLight position={[-700, 100, 300]} intensity={0.35} />

            <Suspense fallback={<Loader />}>
              {/* Bounds fit clip 只在載入時框一次視角(不加 observe,避免點選時重置縮放) */}
              <Bounds fit clip margin={1.2}>
                {/* GLB 原始為 Z-up,轉成 Y-up 讓人體站直、正面朝鏡頭 */}
                <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
                  <AnatomyModel
                    selectedName={selectedName}
                    opacity={opacity}
                    onPick={handlePick}
                  />
                </group>
              </Bounds>
            </Suspense>

            {/* 允許上下旋轉,但限制 polar 範圍避免翻到正上方/正下方(人體全程保持正立) */}
            {/* zoomToCursor: 滾輪縮放朝游標位置,而非畫面中心 */}
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              makeDefault
              zoomToCursor
              minPolarAngle={Math.PI * 0.15}
              maxPolarAngle={Math.PI * 0.85}
            />
          </Canvas>

          {/* 左上控制列:肌肉清單開關 + 透明度滑桿 */}
          {!showList && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowList(true)}
                className="rounded-lg bg-neutral-800/80 px-3 py-2 text-xs text-neutral-200 backdrop-blur hover:bg-neutral-700/80"
              >
                ☰ 肌肉清單
              </button>
              <div className="flex items-center gap-2 rounded-lg bg-neutral-800/80 px-3 py-2 text-xs text-neutral-300 backdrop-blur">
                <span className="whitespace-nowrap">透明度</span>
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-24 accent-blue-400"
                />
                <span className="w-8 tabular-nums text-neutral-400">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* 回原始位置 */}
          <button
            type="button"
            onClick={resetView}
            className="absolute top-4 right-4 rounded-lg bg-neutral-800/80 px-3 py-2 text-xs text-neutral-200 backdrop-blur hover:bg-neutral-700/80"
          >
            回正面視角
          </button>

          {/* ④ 可搜尋肌肉清單(左側浮層) */}
          {showList && (
            <div className="absolute inset-y-0 left-0 z-20">
              <MuscleList
                selectedName={selectedName}
                onSelect={selectMuscle}
                onClose={() => setShowList(false)}
              />
            </div>
          )}

          {/* ② 游標下重疊肌肉的挑選清單 */}
          {pickList && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setPickList(null)}
              />
              <div
                className="fixed z-40 max-h-64 w-52 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900/95 py-1 text-sm shadow-xl backdrop-blur"
                style={{ left: pickList.x + 4, top: pickList.y + 4 }}
              >
                <div className="px-3 py-1 text-[11px] text-neutral-500">
                  這裡有 {pickList.names.length} 塊重疊肌肉
                </div>
                {pickList.names.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectMuscle(name)}
                    className="block w-full px-3 py-1.5 text-left text-neutral-200 hover:bg-neutral-800"
                  >
                    {muscleNameZh(name) ?? name}
                  </button>
                ))}
              </div>
            </>
          )}

          {toast && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-neutral-800/90 px-4 py-2 text-sm text-amber-300 shadow-lg">
              {toast}
            </div>
          )}
        </div>

        {/* 右側動作面板 */}
        <aside className="h-1/2 w-full overflow-hidden border-t border-neutral-800 bg-neutral-950 text-neutral-200 md:h-full md:w-96 md:border-t-0 md:border-l">
          <Panel meshName={selectedName} muscle={muscle} />
        </aside>
      </div>

      {/* Footer 授權標註(CC BY-SA 法律義務,不可省) */}
      <footer className="border-t border-neutral-800 bg-neutral-950 px-4 py-2 text-center text-[11px] leading-relaxed text-neutral-500">
        Anatomy model: BodyParts3D © The Database Center for Life Science (CC
        BY-SA 2.1 JP) / Z-Anatomy (CC BY-SA 4.0). Exercise data: free-exercise-db
        (Public Domain).
      </footer>
    </div>
  )
}

export default App
