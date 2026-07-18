import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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

/**
 * 情境式拖曳:按下時判斷游標下有沒有模型。
 * 有 → 左鍵/單指=旋轉;沒有(空白處)→ 平移。
 * 用 capture 階段搶在 OrbitControls 之前設定,才會即時生效。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DragMode({
  groupRef,
  controlsRef,
}: {
  groupRef: React.RefObject<THREE.Group | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>
}) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const raycaster = useThree((s) => s.raycaster)

  useEffect(() => {
    const el = gl.domElement
    const ndc = new THREE.Vector2()
    const onDown = (e: PointerEvent) => {
      const controls = controlsRef.current
      const group = groupRef.current
      if (!controls || !group) return
      const rect = el.getBoundingClientRect()
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)
      const onModel = raycaster.intersectObject(group, true).length > 0
      controls.mouseButtons.LEFT = onModel ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
      controls.touches.ONE = onModel ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN
    }
    el.addEventListener('pointerdown', onDown, true)
    return () => el.removeEventListener('pointerdown', onDown, true)
  }, [gl, camera, raycaster, groupRef, controlsRef])

  return null
}

function App() {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [opacity, setOpacity] = useState(0.7) // 肌肉透明度預設 70%(可透視深層)
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
    // 鎖住縮小上限:最遠只能拉到「正面視角」的距離,不能再滾更小
    controls.maxDistance = dist
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

  const pill =
    'rounded-xl border border-line bg-surface/70 backdrop-blur-md transition-colors'

  return (
    <div className="flex h-full w-full flex-col bg-ground">
      {/* 主區:3D 場景 + 動作面板 */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative h-1/2 w-full bg-ground md:h-full md:flex-1">
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
              {/* GLB 原始為 Z-up,轉成 Y-up 讓人體站直、正面朝鏡頭 */}
              <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
                <AnatomyModel
                  selectedName={selectedName}
                  opacity={opacity}
                  onPick={handlePick}
                  onReady={resetView}
                />
              </group>
            </Suspense>

            {/* 情境式拖曳:按下時判斷游標下有無模型,切換旋轉/平移 */}
            <DragMode groupRef={groupRef} controlsRef={controlsRef} />

            {/* 允許平移(拖空白處)+ 上下旋轉;polar 範圍避免翻到正上方/正下方 */}
            <OrbitControls
              ref={controlsRef}
              enablePan
              screenSpacePanning
              makeDefault
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
                className={`${pill} flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink-2 hover:text-ink`}
              >
                <span className="text-base text-accent">☰</span> 肌肉清單
              </button>
              <div
                className={`${pill} flex items-center gap-3 px-3.5 py-2.5 text-sm text-ink-2`}
              >
                <span className="whitespace-nowrap">透明度</span>
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="h-1.5 w-28 accent-accent"
                />
                <span className="w-9 text-right tabular-nums text-ink">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* 回原始位置 */}
          <button
            type="button"
            onClick={resetView}
            className={`${pill} absolute top-4 right-4 flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink-2 hover:text-ink`}
          >
            <span className="text-base">⟲</span> 回正面視角
          </button>

          {/* 品牌浮水印 */}
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-xs text-ink-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            肌肉圖鑑 · 3D Muscle Explorer
          </div>

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

          {/* ② 游標下重疊肌肉的挑選清單(依視窗邊界自動往上/左翻,不超出畫面) */}
          {pickList &&
            (() => {
              const PW = 224
              const estH = Math.min(300, 44 + pickList.names.length * 34)
              const left = Math.min(pickList.x + 6, window.innerWidth - PW - 8)
              const flipUp = pickList.y + estH > window.innerHeight - 8
              const top = flipUp
                ? Math.max(8, pickList.y - estH)
                : pickList.y + 6
              return (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setPickList(null)}
                  />
                  <div
                    className="fixed z-40 max-h-[300px] w-56 overflow-y-auto rounded-xl border border-line bg-surface-2/95 py-1.5 text-sm shadow-2xl backdrop-blur-md"
                    style={{ left, top }}
                  >
                    <div className="px-3 py-1 text-[11px] text-ink-3">
                      這裡有 {pickList.names.length} 塊重疊肌肉
                    </div>
                    {pickList.names.map((name) => {
                      const supported = resolveMuscle(name) !== null
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => selectMuscle(name)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-accent/10"
                        >
                          <span
                            className={supported ? 'text-ink-2' : 'text-ink-3'}
                          >
                            {muscleNameZh(name) ?? name}
                          </span>
                          {!supported && (
                            <span className="flex-none text-[10px] text-ink-3">
                              未支援
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )
            })()}

          {toast && (
            <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full border border-warn/30 bg-surface-2/90 px-4 py-2 text-sm text-warn shadow-lg backdrop-blur-md">
              {toast}
            </div>
          )}
        </div>

        {/* 右側動作面板 */}
        <aside className="h-1/2 w-full overflow-hidden border-t border-line bg-surface text-ink md:h-full md:w-[24rem] md:border-t-0 md:border-l">
          <Panel
            meshName={selectedName}
            muscle={muscle}
            onOpenList={() => setShowList(true)}
          />
        </aside>
      </div>

      {/* Footer 授權標註(CC BY-SA 法律義務,不可省) */}
      <footer className="border-t border-line bg-surface px-4 py-2 text-center text-[11px] leading-relaxed text-ink-3">
        Anatomy model: BodyParts3D © The Database Center for Life Science (CC
        BY-SA 2.1 JP) / Z-Anatomy (CC BY-SA 4.0). Exercise data: ExerciseDB
        (hasaneyldrm/exercises-dataset, MIT).
      </footer>
    </div>
  )
}

export default App
