import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { AnatomyModel } from './components/AnatomyModel'
import { Loader } from './components/Loader'
import { Panel } from './components/Panel'
import { MuscleList } from './components/MuscleList'
import { FeedbackModal } from './components/FeedbackModal'
import { MobileMenu } from './components/MobileMenu'
import { ViewportControls } from './components/ViewportControls'
import { AboutModal } from './components/AboutModal'
import { Credits } from './components/Credits'
import { Splash } from './components/Splash'
import { muscleName, symmetryKey } from './data/muscleNameZh'
import { resolveMuscle } from './lib/recommend'
import { useFavorites } from './lib/useFavorites'
import { LANGS, useLang, useT, useUiLang } from './lib/i18n'
import { ensureLang } from './lib/langSteps'
import {
  IconChat,
  IconLanguages,
  IconMenu,
  IconOpacity,
  IconReset,
  IconStar,
} from './components/icons'

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

/** 開場:自轉一圈 + 依序點亮代表性肌肉的總時長(秒) */
const INTRO_DURATION = 2
/**
 * 開場輪流點亮的肌肉(小寫片段,比對 mesh 名)。
 * 順序刻意跟著鏡頭轉動:前 → 側 → 背 → 轉回正面。
 */
const INTRO_FLASH = [
  'pectoralis major',
  'rectus abdominis',
  'deltoid',
  'latissimus dorsi',
  'gluteus maximus',
]

/**
 * 開場運鏡:以 controls.target 為軸心,把相機繞行完整一圈(方位角 +2π)。
 * 繞的是相機而非模型,才會真的原地自轉 —— 直接轉 group 會繞到模型原點
 * (與視覺重心差約 15 單位),看起來像在畫小圓。轉滿一圈後回到原位。
 */
function IntroSpin({
  active,
  controlsRef,
  onDone,
}: {
  active: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>
  onDone: () => void
}) {
  const camera = useThree((s) => s.camera)
  const startSph = useRef<THREE.Spherical | null>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!active || !controls) return
    if (!startSph.current) {
      const offset = new THREE.Vector3().subVectors(
        camera.position,
        controls.target,
      )
      startSph.current = new THREE.Spherical().setFromVector3(offset)
      elapsed.current = 0
    }
    elapsed.current = Math.min(elapsed.current + delta, INTRO_DURATION)
    const sph = startSph.current.clone()
    sph.theta += easeInOut(elapsed.current / INTRO_DURATION) * Math.PI * 2
    camera.position.setFromSpherical(sph).add(controls.target)
    camera.lookAt(controls.target)
    controls.update()
    if (elapsed.current >= INTRO_DURATION) {
      startSph.current = null
      onDone()
    }
  })
  return null
}

/**
 * 平移邊界:每幀把注視點(controls.target)夾在模型包圍盒內。
 * 平移時相機與注視點一起位移,超界時把兩者一併拉回同一量 → 保持視角、只擋越界。
 * 結果:畫面中心永遠落在人體上,模型不會被拖出視窗(手機/平板/桌機皆然)。
 */
function PanLimit({
  controlsRef,
  boxRef,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>
  boxRef: React.RefObject<THREE.Box3 | null>
}) {
  useFrame(() => {
    const controls = controlsRef.current
    const box = boxRef.current
    if (!controls || !box) return
    const t = controls.target
    const cx = Math.min(box.max.x, Math.max(box.min.x, t.x))
    const cy = Math.min(box.max.y, Math.max(box.min.y, t.y))
    const cz = Math.min(box.max.z, Math.max(box.min.z, t.z))
    if (cx !== t.x || cy !== t.y || cz !== t.z) {
      // 相機跟著位移相同量:維持注視方向與距離,只把越界的平移量抵銷掉
      controls.object.position.x += cx - t.x
      controls.object.position.y += cy - t.y
      controls.object.position.z += cz - t.z
      t.set(cx, cy, cz)
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
  const [opacity, setOpacity] = useState(0.5) // 肌肉透明度預設 50%(可透視深層)
  const [showList, setShowList] = useState(false) // 是否顯示可搜尋肌肉清單
  const [pickList, setPickList] = useState<PickList | null>(null) // 游標下多塊重疊時的挑選清單
  const [focusGoal, setFocusGoal] = useState<FocusGoal | null>(null) // 鏡頭要平滑移到的目標
  const [showFavorites, setShowFavorites] = useState(false) // 是否顯示「我的最愛」
  const [showFeedback, setShowFeedback] = useState(false) // 是否顯示留言板
  const [showMenu, setShowMenu] = useState(false) // 手機側邊選單(漢堡)
  const [showAbout, setShowAbout] = useState(false) // 關於/授權視窗
  const [modelReady, setModelReady] = useState(false) // 模型載入完成 → 收起啟動畫面
  // 開場動畫:啟動畫面收完 → intro 期間轉一圈並輪流點亮肌肉 → 結束後才浮出四塊面板
  const [intro, setIntro] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [flashIndex, setFlashIndex] = useState(0)
  const { favorites, toggle: toggleFav } = useFavorites()
  // 肌肉收藏(存去左右的基本名,如 "gluteus maximus")
  const { favorites: favMuscles, toggle: toggleFavMuscle } = useFavorites(
    'muscle3d.favMuscles',
  )
  const { lang, setLang } = useLang()
  const uiLang = useUiLang()
  const t = useT()
  const en = uiLang === 'en'
  const [, setLangTick] = useState(0)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // 點選單以外的地方就關閉(不用全螢幕遮罩,避免蓋住選單本身)
  useEffect(() => {
    if (!langMenuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!langMenuRef.current?.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [langMenuOpen])

  // 選到其他語言時延遲載入其步驟,載到後 re-render
  useEffect(() => {
    let cancelled = false
    ensureLang(lang).then(() => !cancelled && setLangTick((n) => n + 1))
    return () => {
      cancelled = true
    }
  }, [lang])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const centroidRef = useRef<THREE.Vector3 | null>(null) // 幾何重心(只算一次)
  const panBoxRef = useRef<THREE.Box3 | null>(null) // 平移邊界(注視點鎖在模型包圍盒內)

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

  /**
   * 回正面視角。animate=true → 走 FocusAnimator 的緩入緩出(跟清單選肌肉一致);
   * animate=false → 直接就位(初次載入用,避免從奇怪位置飛過來)。
   * 旋轉樞紐:XZ 取重心(才會原地旋轉),Y 取包圍盒中心(畫面垂直置中)。
   */
  const resetView = (animate = true) => {
    const group = groupRef.current
    const controls = controlsRef.current
    if (!group || !controls) return
    const box = new THREE.Box3().setFromObject(group)
    // 平移邊界:以模型包圍盒為基準再往外擴一圈,平移有餘裕、但仍拖不出畫面。
    // 桌機視窗寬、需要更多餘裕 → 用較大係數;手機維持較緊。要調鬆緊改這兩個數。
    if (!panBoxRef.current) {
      const pb = box.clone()
      const s = pb.getSize(new THREE.Vector3())
      const margin = window.innerWidth >= 768 ? 1.4 : 0.6
      pb.expandByVector(s.multiplyScalar(margin))
      panBoxRef.current = pb
    }
    const bboxC = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const cen = getCentroid(group)
    const target = new THREE.Vector3(cen.x, bboxC.y, cen.z)
    const cam = controls.object as THREE.PerspectiveCamera
    const fov = (cam.fov * Math.PI) / 180
    // 依身高/身寬算出剛好框滿的距離,再留一點邊界
    const dist = (Math.max(size.y, size.x) / 2 / Math.tan(fov / 2)) * 1.3
    // 鎖住縮小上限:最遠只能拉到「正面視角」的距離
    controls.maxDistance = dist
    const pos = new THREE.Vector3(target.x, target.y, target.z + dist)

    if (animate) {
      setFocusGoal({ pos, target })
      return
    }
    cam.position.copy(pos)
    controls.target.copy(target)
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
    setToast(t('notSupportedToast'))
    const timer = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedName, muscle])

  // 開場期間每隔一段時間換下一塊肌肉,轉一圈剛好輪完一輪
  useEffect(() => {
    if (!intro) return
    const step = (INTRO_DURATION * 1000) / INTRO_FLASH.length
    const timer = setInterval(
      () => setFlashIndex((i) => Math.min(i + 1, INTRO_FLASH.length - 1)),
      step,
    )
    return () => clearInterval(timer)
  }, [intro])

  /** 啟動畫面收完的接手點:開場動畫是純裝飾,使用者要求減少動態就直接跳過。 */
  const startIntro = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches
    if (reduce) {
      setIntroDone(true)
      return
    }
    setIntro(true)
  }

  const endIntro = () => {
    setIntro(false)
    setIntroDone(true)
  }

  const headerBtn =
    'flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/60 px-2.5 py-1.5 text-xs sm:text-sm transition-colors'

  // 四塊面板在開場結束後才淡入(各自從外側輕輕滑進來)
  const chrome = 'transition-all duration-500 ease-out'
  const chromeHidden = introDone ? 'opacity-100' : 'pointer-events-none opacity-0'

  return (
    <div className="relative flex h-full w-full flex-col bg-ground">
      {/* 頂部工具列:品牌 + 所有控制,取代散落的浮層按鈕 */}
      <header
        className={`relative z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface/70 px-3 py-2 backdrop-blur-xl sm:px-4 ${chrome} ${chromeHidden} ${
          introDone ? 'translate-y-0' : '-translate-y-3'
        }`}
      >
        {/* 品牌(游標靠近整區 → 綠點呼吸燈) */}
        <div className="group/brand flex cursor-default items-center gap-2">
          <span className="brand-dot inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="text-base font-semibold tracking-tight text-ink">
            Vector
          </span>
          <span className="hidden text-xs text-ink-3 sm:inline">
            3D Muscle Explorer
          </span>
        </div>

        {/* 手機:漢堡鈕(右),點開從左側滑出的側邊選單 */}
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          aria-label={t('muscles')}
          className={`${headerBtn} ml-auto text-ink-2 md:hidden`}
        >
          <IconMenu />
        </button>

        {/* 桌機:完整控制群(手機收進側邊選單) */}
        <div className="ml-auto hidden flex-wrap items-center gap-1.5 md:flex">
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className={`${headerBtn} ${
              showList
                ? 'border-accent/40 text-accent'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <IconMenu /> {t('muscles')}
          </button>
          <button
            type="button"
            onClick={() => setShowFavorites((v) => !v)}
            className={`${headerBtn} ${
              showFavorites
                ? 'border-accent/40 text-accent'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <IconStar /> {t('favorites')}
            {favorites.size + favMuscles.size > 0 && (
              <span className="tabular-nums text-ink-3">
                {favorites.size + favMuscles.size}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className={`${headerBtn} text-ink-2 hover:text-ink`}
          >
            <IconChat /> <span className="hidden sm:inline">{t('feedback')}</span>
          </button>

          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((v) => !v)}
              className={`${headerBtn} text-ink-2 hover:text-ink`}
            >
              <IconLanguages />
              <span className="hidden sm:inline">{t('language')}</span>
            </button>
            {langMenuOpen && (
              <div className="absolute top-full right-0 z-50 mt-1 max-h-72 w-40 overflow-y-auto rounded-xl border border-line bg-surface-2/95 py-1 shadow-2xl backdrop-blur-md">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code)
                      setLangMenuOpen(false)
                    }}
                    className={
                      'block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent/10 ' +
                      (l.code === lang
                        ? 'font-medium text-accent'
                        : 'text-ink-2 hover:text-ink')
                    }
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => resetView(true)}
            className={`${headerBtn} text-ink-2 hover:text-ink`}
          >
            <IconReset />
            <span className="hidden sm:inline">{t('resetView')}</span>
          </button>

          {/* group:游標進入整個框就一起變亮(文字)與轉綠(拉桿),與其他按鈕行為一致 */}
          <div
            className={`${headerBtn} group cursor-default text-ink-2 hover:text-ink`}
          >
            <IconOpacity />
            <span className="hidden whitespace-nowrap sm:inline">
              {t('opacity')}
            </span>
            <input
              type="range"
              min={0.15}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              aria-label={t('opacity')}
              className="range-accent w-12 sm:w-16"
              style={
                {
                  '--range-progress': (opacity - 0.15) / 0.85,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </header>

      {/* 3D 場景:鋪在最底層。桌機時右邊留出面板寬度(24rem),
          canvas 只到面板左緣,模型自動置中在可見區、不被右邊面板遮住一半。 */}
      <div className="absolute inset-0 z-0 md:right-96">
        <div className="h-full w-full">
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

            <Suspense fallback={<Loader label={t('loading')} />}>
              {/* GLB 原始為 Z-up,轉成 Y-up 讓人體站直、正面朝鏡頭 */}
              <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
                <AnatomyModel
                  selectedName={selectedName}
                  opacity={opacity}
                  onPick={handlePick}
                  flash={intro ? INTRO_FLASH[flashIndex] : null}
                  onReady={() => {
                    resetView(false)
                    setModelReady(true)
                  }}
                />
              </group>
            </Suspense>

            {/* 情境式拖曳:按下時判斷游標下有無模型,切換旋轉/平移 */}
            <DragMode groupRef={groupRef} controlsRef={controlsRef} />

            {/* 平移邊界:模型不會被拖出視窗 */}
            <PanLimit controlsRef={controlsRef} boxRef={panBoxRef} />

            {/* 開場:繞著模型轉一圈 */}
            <IntroSpin
              active={intro}
              controlsRef={controlsRef}
              onDone={endIntro}
            />

            {/* 從清單選肌肉時,平滑把鏡頭轉到該肌肉並置中 */}
            <FocusAnimator
              goal={focusGoal}
              controlsRef={controlsRef}
              onDone={() => setFocusGoal(null)}
            />

            {/* 允許平移(拖空白處)+ 上下旋轉;polar 範圍避免翻到正上方/正下方 */}
            <OrbitControls
              ref={controlsRef}
              /* 開場運鏡期間不接受操作,避免使用者拖曳與動畫互相打架 */
              enabled={!intro}
              enablePan
              screenSpacePanning
              makeDefault
              minPolarAngle={Math.PI * 0.15}
              maxPolarAngle={Math.PI * 0.85}
            />

            {/* Bloom:讓高亮肌肉的青綠自發光「貼著肌肉」微微外溢(radius 小 = 不會變大圓圈) */}
            <EffectComposer enableNormalPass={false}>
              <Bloom
                mipmapBlur
                intensity={0.45}
                radius={0.3}
                luminanceThreshold={0.5}
                luminanceSmoothing={0.2}
              />
            </EffectComposer>
          </Canvas>
        </div>
      </div>

      {/* 中段:左半留給 3D(不擋事件)、右半為動作面板 */}
      <div className="pointer-events-none relative z-20 flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 flex-1">
          {/* 手機:模型區右下角漂浮操作鈕(正面視角 + 透明度) */}
          {introDone && (
            <ViewportControls
              opacity={opacity}
              setOpacity={setOpacity}
              onReset={() => resetView(true)}
            />
          )}

          {/* ④ 可搜尋肌肉清單(左側浮層) */}
          {showList && (
            <div className="pointer-events-auto absolute inset-y-0 left-0 z-20">
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
                    className="pointer-events-auto fixed inset-0 z-30"
                    onClick={() => setPickList(null)}
                  />
                  <div
                    className="pointer-events-auto fixed z-40 max-h-[300px] w-56 overflow-y-auto rounded-xl border border-ink-3/30 bg-[#242a33]/98 py-1.5 text-sm shadow-2xl backdrop-blur-md"
                    style={{ left, top }}
                  >
                    <div className="px-3 py-1 text-[11px] text-ink-2">
                      {en
                        ? `${pickList.names.length} ${t('overlapHere')}`
                        : `這裡有 ${pickList.names.length} ${t('overlapHere')}`}
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
                                  ? 'text-white'
                                  : 'text-ink-2'
                            }
                          >
                            {muscleName(name, en)}
                          </span>
                          {!supported && (
                            <span className="flex-none text-[10px] text-ink-2">
                              {t('unsupported')}
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
            <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full border border-accent/30 bg-surface-2/90 px-4 py-2 text-sm text-accent shadow-lg backdrop-blur-md">
              {toast}
            </div>
          )}
        </div>

        {/* 右側動作面板 */}
        <aside
          className={`h-1/2 w-full overflow-hidden border-t border-line bg-surface/70 text-ink backdrop-blur-xl md:h-full md:w-[24rem] md:border-t-0 md:border-l ${chrome} ${
            introDone
              ? 'pointer-events-auto translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-4 opacity-0'
          }`}
        >
          <Panel
            meshName={selectedName}
            muscle={muscle}
            showFavorites={showFavorites}
            onCloseFavorites={() => setShowFavorites(false)}
            favorites={favorites}
            toggleFav={toggleFav}
            favMuscles={favMuscles}
            toggleFavMuscle={toggleFavMuscle}
            muscleKeyOf={symmetryKey}
            onPickFavMuscle={focusMuscle}
          />
        </aside>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {/* 啟動畫面:蓋住整個畫面直到模型載入完成再淡出 */}
      <Splash ready={modelReady} onHidden={startIntro} />

      {/* Footer:作者署名 + 授權標註(CC BY-SA 法律義務,不可省)。
          手機版空間有限,改收進側邊選單的「關於」,此處僅桌機顯示。 */}
      <footer
        className={`relative z-30 hidden border-t border-line bg-surface/70 px-4 py-2 text-center backdrop-blur-xl md:block ${chrome} ${chromeHidden} ${
          introDone ? 'translate-y-0' : 'translate-y-3'
        }`}
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <Credits />
      </footer>

      {/* 手機側邊選單(漢堡):頂部工具列 + 左側肌肉清單 + 關於 */}
      <MobileMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        favCount={favorites.size + favMuscles.size}
        onOpenFavorites={() => {
          setShowFavorites(true)
          setShowMenu(false)
        }}
        onFeedback={() => {
          setShowFeedback(true)
          setShowMenu(false)
        }}
        onAbout={() => {
          setShowAbout(true)
          setShowMenu(false)
        }}
        selectedName={selectedName}
        onSelectMuscle={(name) => {
          focusMuscle(name)
          setShowMenu(false)
        }}
      />

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}

export default App
