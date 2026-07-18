import { useEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_URL = '/anatomy.glb'

// 拖曳超過這個像素位移就算「旋轉」,不觸發點選
const CLICK_THRESHOLD_PX = 5
// 高亮:底色染成主色青綠(= 透明度拉桿那個綠,#2dd4bf),受燈光著色 → 保留立體感;
// 再加微弱同色自發光當選中光暈(底色已是青綠,不會像 emissive 打紅肌肉那樣發白)
const HIGHLIGHT_TINT = new THREE.Color('#2dd4bf')
const HIGHLIGHT_EMISSIVE = new THREE.Color('#2dd4bf')
const HIGHLIGHT_INTENSITY = 0.3 // 低強度,不蓋掉陰影
const NO_EMISSIVE = new THREE.Color('#000000')

interface AnatomyModelProps {
  /** 目前選中的 mesh 名稱(null = 沒選) */
  selectedName: string | null
  /** 全域肌肉透明度(1 = 不透明);選中的肌肉一律維持不透明 */
  opacity: number
  /**
   * 點擊時回呼「游標下的重疊肌肉(依深度去重排序)」與螢幕座標。
   * 只有一塊時 App 直接選;多塊時 App 跳清單讓使用者挑。
   */
  onPick: (meshNames: string[], clientX: number, clientY: number) => void
  /** 模型載入並掛載完成後呼叫一次(用來設定初始正面視角) */
  onReady: () => void
}

/** 從被 raycast 命中的物件取得它的解剖名稱(名字在 mesh 或其父節點上)。 */
function meshNameOf(obj: THREE.Object3D): string {
  return obj.name || obj.parent?.name || ''
}

/**
 * 對稱鍵:去掉 left/right 與底線後的肌肉名,用來讓左右同名肌肉一起高亮。
 * e.g. "left_gluteus_maximus" / "right_gluteus_maximus" -> "gluteus maximus"
 */
function symmetryKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b(left|right)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Loads the anatomy GLB and wires up per-mesh picking, highlight, and a global
 * transparency control for peeking at deeper muscles.
 * The GLB shares only 2 materials (muscle/tendon) across 467 meshes, so we
 * clone each mesh's material on load — otherwise editing one affects all.
 */
export function AnatomyModel({
  selectedName,
  opacity,
  onPick,
  onReady,
}: AnatomyModelProps) {
  const { scene } = useGLTF(MODEL_URL)
  const downPos = useRef<{ x: number; y: number } | null>(null)

  // 模型掛載完成後通知一次(此時包圍盒可算,設定初始正面視角)
  useEffect(() => {
    onReady()
    // 僅在掛載時執行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // clone 每塊 mesh 的材質(高亮/透明互不干擾);雙面渲染避免薄片肌肉看穿破洞
  useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && mesh.material) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
        mat.side = THREE.DoubleSide
        // 記下原始底色,取消高亮時還原
        mesh.userData.baseColor = mat.color.clone()
        mesh.material = mat
      }
    })
  }, [scene])

  // 套用高亮 + 透明度:選中的(含左右對稱另一邊)加藍光且維持不透明,其餘套用滑桿透明度
  useEffect(() => {
    const selectedKey = selectedName ? symmetryKey(selectedName) : null
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      // 不分左右:同一塊肌肉的左右兩邊一起高亮
      const isHighlighted =
        selectedKey !== null && symmetryKey(mesh.name) === selectedKey
      // 染綠底色(仍受燈光著色 → 保留立體感);未選則還原原始底色
      if (isHighlighted) {
        mat.color.copy(HIGHLIGHT_TINT)
        mat.emissive.copy(HIGHLIGHT_EMISSIVE)
        mat.emissiveIntensity = HIGHLIGHT_INTENSITY
      } else {
        const base = mesh.userData.baseColor as THREE.Color | undefined
        if (base) mat.color.copy(base)
        mat.emissive.copy(NO_EMISSIVE)
        mat.emissiveIntensity = 1
      }
      const o2 = isHighlighted ? 1 : opacity
      mat.opacity = o2
      mat.transparent = o2 < 1
      // 透明時關 depthWrite,讓深層肌肉能透出來(x-ray 視覺)
      mat.depthWrite = o2 >= 1
    })
  }, [selectedName, opacity, scene])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!downPos.current) return
    const dx = e.clientX - downPos.current.x
    const dy = e.clientY - downPos.current.y
    downPos.current = null
    // 位移過大 = 使用者在旋轉,不算點選
    if (Math.hypot(dx, dy) > CLICK_THRESHOLD_PX) return
    e.stopPropagation()
    // 收集游標下所有重疊肌肉,依深度排序後用對稱鍵去重(左右視為同一塊)
    const seen = new Set<string>()
    const names: string[] = []
    for (const hit of e.intersections) {
      const name = meshNameOf(hit.object)
      if (!name) continue
      const key = symmetryKey(name)
      if (seen.has(key)) continue
      seen.add(key)
      names.push(name)
    }
    if (names.length > 0) onPick(names, e.clientX, e.clientY)
  }

  return (
    <primitive
      object={scene}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  )
}

// 提前預載,減少首次點進來的等待
useGLTF.preload(MODEL_URL)
