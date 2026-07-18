import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { AnatomyModel, symmetryKey } from './components/AnatomyModel'
import { Loader } from './components/Loader'
import { Panel } from './components/Panel'
import { MuscleList } from './components/MuscleList'
import { muscleNameZh } from './data/muscleNameZh'
import { resolveMuscle } from './lib/recommend'
import { useFavorites } from './lib/useFavorites'

interface PickList {
  names: string[]
  x: number
  y: number
}

interface FocusGoal {
  pos: THREE.Vector3
  target: THREE.Vector3
}

const FOCUS_DURATION = 0.75 // 秒
// easeInOutCubic:緩入緩出,起步與收尾都柔和,不會一開始猛衝
const easeInOut = (u: number) =>
  u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2

/** 以固定時間 + 緩入緩出把相機移到 goal(面向選中的肌肉並置中);到位後呼叫 onDone。 */
function FocusAnimator({
  goal,
  controlsRef,
  onDone,
}: {
  goal: FocusGoal | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>
  onDone: () => void
}) {
  const camera = useThree((s) => s.camera)
  const startPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const elapsed = useRef(0)
  const activeGoal = useRef<FocusGoal | null>(null)

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!goal || !controls) return
    // 新目標 → 記錄起點、歸零計時
    if (activeGoal.current !== goal) {
      activeGoal.current = goal
      startPos.current.copy(camera.position)
      startTarget.current.copy(controls.target)
      elapsed.current = 0
    }
    elapsed.current = Math.min(elapsed.current + delta, FOCUS_DURATION)
    const e = easeInOut(elapsed.current / FOCUS_DURATION)
    camera.position.lerpVectors(startPos.current, goal.pos, e)
    controls.target.lerpVectors(startTarget.current, goal.target, e)
    controls.update()
    if (elapsed.current >= FOCUS_DURATION) {
      activeGoal.current = null
      onDone()
    }
  })
  return null
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
  const [focusGoal, setFocusGoal] = useState<FocusGoal | null>(null) // 鏡頭要平滑移到的目標
  const [showFavorites, setShowFavorites] = useState(false) // 是否顯示「我的最愛」
  const { favorites, toggle: toggleFav } = useFavorites()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const centroidRef = useRef<THREE.Vector3 | null>(null) // 幾何重心(只算一次)

  // 取某肌肉(含左右)的世界包圍盒 + 水平外向方向(前面→前、背面→後、側面→側)
  const muscleBoxDir = (name: string) => {
    const group = groupRef.current
    if (!group) return null
    const key = symmetryKey(name)
    const box = new THREE.Box3()
    let found = false
    group.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && symmetryKey(mesh.name) === key) {
        box.expandByObject(mesh)
        found = true
      }
    })
    if (!found || box.isEmpty()) return null
    const center = box.getCenter(new THREE.Vector3())
    const dir = new THREE.Vector3()
      .subVectors(center, getCentroid(group))
      .setY(0)
    const sideways = dir.lengthSq() < 1e-4
    if (sideways) dir.set(0, 0, 1)
    dir.normalize()
    return { box, center, dir, sideways }
  }

  // 該肌肉目前是否朝向鏡頭(相機在它的外向側)?中線肌肉一律算 true
  const isFacingCamera = (name: string): boolean => {
    const controls = controlsRef.current
    const info = muscleBoxDir(name)
    if (!controls || !info) return true
    if (info.sideways) return true
    const camSide = new THREE.Vector3()
      .subVectors(controls.object.position, info.center)
      .normalize()
    return camSide.dot(info.dir) > -0.1 // 明顯背對鏡頭才排除
  }

  // 平滑轉到「面向該肌肉並置中」的鏡頭目標(清單選取用)
  const focusGoalFor = (name: string): FocusGoal | null => {
    const controls = controlsRef.current
    const info = muscleBoxDir(name)
    if (!controls || !info) return null
    const radius = info.box.getSize(new THREE.Vector3()).length() / 2
    const cam = controls.object as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180
    let dist = (radius / Math.tan(fov / 2)) * 2.4
    dist = Math.min(dist, controls.maxDistance ?? dist)
    dist = Math.max(dist, 120)
    return {
      pos: info.center.clone().addScaledVector(info.dir, dist),
      target: info.center.clone(),
    }
  }

  // 挑選清單(3D 重疊)選肌肉:只換高亮/面板,不動鏡頭
  const selectMuscle = (name: string) => {
    setSelectedName(name)
    setPickList(null)
    setShowFavorites(false)
  }

  // 從清單選肌肉:一律平滑轉到面向該肌肉並置中
  const focusMuscle = (name: string) => {
    setSelectedName(name)
    setPickList(null)
    setShowFavorites(false)
    setShowList(false) // 從清單選完就關閉清單,露出置中的肌肉
    const goal = focusGoalFor(name)
    if (goal) setFocusGoal(goal)
  }

  // 點擊 3D:排除「背對目前視角」的肌肉(正面時不列背面),不轉鏡頭;
  // 選最前面那塊,若剩多塊重疊再跳清單。
  const handlePick = (names: string[], x: number, y: number) => {
    const facing = names.filter(isFacingCamera)
    const list = facing.length > 0 ? facing : names
    setSelectedName(list[0])
    setPickList(list.length > 1 ? { names: list, x, y } : null)
    setShowFavorites(false)
  }

  // 幾何重心(頂點平均)—— 比包圍盒中心更接近視覺質量中心;只算一次並快取
  const getCentroid = (group: THREE.Group): THREE.Vector3 => {
    if (centroidRef.current) return centroidRef.current
    const c = new THREE.Vector3()
    const v = new THREE.Vector3()
    let n = 0
    group.updateWorldMatrix(true, true)
    group.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const pos = mesh.geometry.attributes.position as
        | THREE.BufferAttribute
        | undefined
      if (!pos) return
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
        c.add(v)
        n++
      }
    })
    if (n > 0) c.multiplyScalar(1 / n)
    centroidRef.current = c
    return c
  }

  // 回正面視角:左右旋轉樞紐用「重心 XZ」(才會原地旋轉),Y 用包圍盒中心(畫面置中)
  const resetView = () => {
    const group = groupRef.current
    const controls = controlsRef.current
    if (!group || !controls) return
    const box = new THREE.Box3().setFromObject(group)
    const bboxC = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const cen = getCentroid(group)
    // 旋轉樞紐:XZ 取重心(消除左右旋轉的小圓漂移),Y 取包圍盒中心(維持垂直置中)
    const target = new THREE.Vector3(cen.x, bboxC.y, cen.z)
    const cam = controls.object as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180
    // 依身高/身寬算出剛好框滿的距離,再留一點邊界
    const dist = (Math.max(size.y, size.x) / 2 / Math.tan(fov / 2)) * 1.3
    cam.position.set(target.x, target.y, target.z + dist)
    controls.target.copy(target)
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

            {/* 從清單選肌肉時,平滑把鏡頭轉到該肌肉並置中 */}
            <FocusAnimator
              goal={focusGoal}
              controlsRef={controlsRef}
              onDone={() => setFocusGoal(null)}
            />

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
              <button
                type="button"
                onClick={() => setShowFavorites((v) => !v)}
                className={`${pill} flex items-center gap-1.5 px-3.5 py-2.5 text-sm ${
                  showFavorites ? 'text-warn' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <span className="text-base text-warn">★</span> 我的最愛
                {favorites.size > 0 && (
                  <span className="tabular-nums text-ink-3">
                    {favorites.size}
                  </span>
                )}
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
                onSelect={focusMuscle}
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
                      這裡有 {pickList.names.length} 塊重疊肌肉 你想選擇的是？
                    </div>
                    {pickList.names.map((name) => {
                      const supported = resolveMuscle(name) !== null
                      const active = name === selectedName
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => selectMuscle(name)}
                          className={
                            'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-accent/10 ' +
                            (active ? 'bg-accent/10' : '')
                          }
                        >
                          <span
                            className={
                              active
                                ? 'font-medium text-accent'
                                : supported
                                  ? 'text-ink-2'
                                  : 'text-ink-3'
                            }
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
            showFavorites={showFavorites}
            onCloseFavorites={() => setShowFavorites(false)}
            favorites={favorites}
            toggleFav={toggleFav}
          />
        </aside>
      </div>

      {/* Footer 授權標註(CC BY-SA 法律義務,不可省) */}
      <footer className="border-t border-line bg-surface px-4 py-2 text-center text-[11px] leading-relaxed text-ink-3">
        Anatomy model: BodyParts3D © The Database Center for Life Science (CC
        BY-SA 2.1 JP) / Z-Anatomy (CC BY-SA 4.0). Exercise data: ExerciseDB
        (hasaneyldrm/exercises-dataset, MIT). Exercise images/GIFs © GymVisual
        (gymvisual.com).
      </footer>
    </div>
  )
}

export default App
