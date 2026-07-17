# 3D 互動肌肉圖網站 — Claude Code 技術規格書

> **給 Claude Code 的說明**：這是一份專案規格書。請先完整讀完，再開始動工。
> 註解語言：邏輯說明用繁體中文，API doc / 文件註解用英文。
> commit message、變數命名一律英文。

---

## 0. 這個專案是什麼

一個網頁，中央顯示一個可旋轉的 **3D 人體肌肉模型**。使用者**點擊某塊肌肉**，右側面板就**列出最適合訓練那塊肌肉的動作**。

**用途**：作者自用 + 作品集（portfolio piece）。**不是**要上線販售的產品，所以：
- 不需要後端 / 資料庫 / 帳號系統，全部 static、client-side
- 不需要 SEO、金流、多語系
- **要**乾淨的程式碼與好看的 UI（這是作品集，code 跟視覺都會被看）

**硬性目標：3 天內完成可部署的版本。** 範圍已經為此收斂過，請不要擅自擴充。

---

## 1. 技術棧（已定案，不要換）

| 項目 | 選擇 | 理由 |
|---|---|---|
| Framework | **Vite + React + TypeScript** | 作品集用，TS 讓 code 更專業 |
| 3D | **React Three Fiber (@react-three/fiber)** | 宣告式，raycasting/點擊內建 |
| 3D helpers | **@react-three/drei** | `useGLTF` / `OrbitControls` / `Bounds` / `Center` |
| 3D 後製（可選） | **@react-three/postprocessing** | hover outline，時間不夠可跳過 |
| 樣式 | **Tailwind CSS** | 快速排版 |
| 部署 | **Vercel** | 一鍵、免費、作品集展示網址漂亮 |

不要引入 Next.js（此專案不需要 SSR，Vite 更輕）。

---

## 2. 資產與資料來源（重要：授權已確認）

### 2.1 3D 模型
**直接借用開源專案 `JohanBellander/BodyExplorer` 已經處理好的資產**，不要自己進 Blender 做前處理。

- Repo: `https://github.com/JohanBellander/BodyExplorer`
- 需要的檔案：
  - `public/anatomy.glb`（467 個肌肉/肌腱 mesh，約 24MB，已 decimate 到 ~4000 faces）
  - `public/mesh_mapping.json`（mesh metadata / 名稱對照）
- **第一步請先 clone 這個 repo，讀 `src/bodyBuilder.js`、`src/muscleData.js`、`mesh_mapping.json`**，搞懂 mesh 的命名規則與座標。它是 vanilla Three.js 寫的，我們**不 fork 它的前端**，只借資產，前端用 R3F 重寫。

**授權**：資產源自 BodyParts3D（CC BY-SA 2.1 JP）+ Z-Anatomy（CC BY-SA 4.0）。
- 可商用、可自用、可放作品集 ✅
- **必須在頁面 footer 附上出處標註**（見 §6）
- CC BY-SA 只約束「模型資產」，**不會傳染到我們的原始碼**，React code 可自訂授權

### 2.2 動作資料庫
用 **`yuhonas/free-exercise-db`**（Public Domain，授權最乾淨）。
- 資料網址（直接抓 JSON，不需 API key）：
  `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`
- 每筆含：`name`、`primaryMuscles[]`、`secondaryMuscles[]`、`equipment`、`level`、`instructions[]`、`images[]`
- **請把這份 JSON 下載到專案 `src/data/exercises.json`（打包進去，不要 runtime 才抓）**，避免 GitHub CDN 掛掉時網站壞掉

---

## 3. 核心難點：兩套 taxonomy 的對照層

這是整個專案的靈魂，也是最容易出錯的地方，請特別小心。

存在三層命名，彼此不一致：

```
GLB 裡的 mesh 名稱         我們定義的 muscleId        exercise-db 的 muscle 字串
(解剖學細分，467 個)   →   (訓練導向，~12 個)      →   ("chest" / "lats" ...)
"pectoralis_major_..."    "chest"                    "chest"
```

### 3.1 建立 `src/data/muscleMap.ts`
手動建立一張對照表。**第一版只做下面這 12 個主要肌群**（其餘 mesh 點下去 fallback 到「尚未支援」提示，不要試圖 map 全部 467 個）：

| muscleId | 中文 | 對應 exercise-db muscle 字串 |
|---|---|---|
| `chest` | 胸 | chest |
| `lats` | 闊背肌 | lats |
| `traps` | 斜方肌 | traps, middle back |
| `shoulders` | 肩 | shoulders |
| `biceps` | 二頭 | biceps |
| `triceps` | 三頭 | triceps |
| `forearms` | 前臂 | forearms |
| `abs` | 腹 | abdominals |
| `glutes` | 臀 | glutes |
| `quads` | 股四頭 | quadriceps |
| `hamstrings` | 腿後 | hamstrings |
| `calves` | 小腿 | calves |

結構建議：
```ts
// muscleMap.ts
// meshNamePattern: GLB mesh 名稱的比對規則（用 includes 或 regex）
// 左右對稱的 mesh 共用同一個 muscleId
export interface MuscleDef {
  id: string;              // 內部 muscleId
  labelZh: string;         // 顯示用中文
  meshPatterns: string[];  // 符合這些字串的 mesh 都算這塊肌肉
  dbMuscles: string[];     // 對應 free-exercise-db 的 muscle 值
}
export const MUSCLE_MAP: MuscleDef[] = [ /* 上表 12 筆 */ ];
```
> ⚠️ mesh 實際名稱要**打開 mesh_mapping.json 確認**，上表的 pattern 是示意，不要照抄。

### 3.2 查詢邏輯 `src/lib/recommend.ts`
```
點到的 mesh.name
  → 用 meshPatterns 反查 muscleId（找不到就回 null → UI 顯示未支援）
  → 用 dbMuscles 過濾 exercises，primaryMuscles 命中的排前面，secondaryMuscles 命中的排後面
  → 回傳排序後的動作清單
```
排序規則（簡單版，先做這個）：
1. `primaryMuscles` 命中 → 權重高
2. `secondaryMuscles` 命中 → 權重低
3. 同權重時，`level` compound/beginner 優先

---

## 4. 前端互動細節（3D 的坑都在這）

### 4.1 場景
- `<Canvas>` + `<OrbitControls enablePan={false} />`（旋轉+縮放即可，不給平移避免使用者迷路）
- `useGLTF('/anatomy.glb')` 載入，用 `<Bounds fit clip>` 自動框好視角
- 環境光 + 一盞方向光，material 用模型內建即可，額外 bake AO 時間不夠可跳過

### 4.2 點擊 vs 拖曳（**必做，否則行動裝置體驗會壞**）
觸控與滑鼠上，`onClick` 會跟 orbit 拖曳打架。實作方式：
- `onPointerDown` 記下起始座標
- `onPointerUp` 比對位移，**小於 ~5px 才算「點選」**，否則視為旋轉、不觸發
- 記得 `e.stopPropagation()`

### 4.3 選取回饋
- 被選中的 mesh：改 `material.emissive` 加亮，或用 postprocessing `Outline`
- 未對應到肌群的 mesh：點了顯示 toast「這塊肌肉尚未支援」
- （加分，時間夠再做）**透明度滑桿**：讓表層肌肉半透明，才點得到深層肌肉——這是 3D 相對 2D 唯一的真實優勢，作品集會加分

### 4.4 效能
- 用 `gltf-transform optimize` 壓一次 `anatomy.glb`（meshopt + ktx2），目標 < 8MB
  ```bash
  npx @gltf-transform/cli optimize anatomy.glb anatomy.opt.glb --compress meshopt
  ```
- Canvas 加 `<Suspense>` + loading 畫面

---

## 5. 版面（RWD）

```
桌機：
┌─────────────────────────┬──────────────┐
│                         │  肌肉名稱     │
│      3D Canvas          │  ──────────  │
│   (可旋轉/縮放/點選)      │  推薦動作清單 │
│                         │  (卡片列表)   │
└─────────────────────────┴──────────────┘
手機：
上半 3D Canvas / 下半 動作面板（點肌肉後自動滑到面板）
```
動作卡片顯示：動作名稱、主要肌群 tag、器材、難度、第一張 image（有的話）、點開看 instructions。

---

## 6. 一定要做的收尾

- **Footer 授權標註**（法律義務，不可省）：
  > Anatomy model: BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 JP) / Z-Anatomy (CC BY-SA 4.0). Exercise data: free-exercise-db (Public Domain).
- `README.md`：專案簡介、技術棧、跑起來的指令、一張截圖 —— 這是作品集，README 會被看
- 部署到 Vercel，把網址放進 README

---

## 7. 三天執行計畫（給 Claude Code 的里程碑）

### Day 1 — 骨架 + 模型上場
- [ ] `npm create vite@latest`（react-ts）、裝 R3F / drei / tailwind
- [ ] clone BodyExplorer，讀懂資產與 mesh 命名，複製 `anatomy.glb`、`mesh_mapping.json` 進專案並壓縮
- [ ] `<Canvas>` 載入模型、OrbitControls、Bounds 框好視角、Suspense loading
- **驗收**：瀏覽器能看到可旋轉的 3D 肌肉模型

### Day 2 — 點選 + 資料層
- [ ] 下載 `exercises.json` 進 `src/data/`
- [ ] 寫 `muscleMap.ts`（先做 12 肌群，pattern 依 mesh_mapping.json 校正）
- [ ] 實作 pointer down/up 點選判定、選取高亮
- [ ] 寫 `recommend.ts`：mesh → muscleId → 排序後的動作清單
- **驗收**：點胸肌，右側正確列出胸的動作且排序合理

### Day 3 — UI + 部署
- [ ] 動作卡片面板、RWD、未支援肌肉的 toast
- [ ] （時間夠）透明度剝層滑桿
- [ ] Footer 授權、README + 截圖
- [ ] 部署 Vercel
- **驗收**：手機開網址能順暢操作，網址可貼進作品集

---

## 8. 明確的「不要做」清單（守住 3 天）

- ❌ 不要自己進 Blender 重做模型（借 BodyExplorer 資產就好）
- ❌ 不要 map 全部 467 個 mesh（只做 12 個主要肌群）
- ❌ 不要做帳號 / 收藏 / 訓練紀錄（那是 v2）
- ❌ 不要接 runtime API（資料全部打包進去）
- ❌ 不要為了「完美的推薦演算法」卡住（先做 primary/secondary 排序，能動就好）

---

## 9. 開工第一件事

先 clone BodyExplorer 並把 `mesh_mapping.json` 印出來給我看，我們一起確認 mesh 命名規則後，再校正 `muscleMap.ts` 的 pattern。**在確認命名規則前，不要開始寫對照表。**
