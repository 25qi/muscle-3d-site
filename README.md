# 3D 互動肌肉圖 (Interactive 3D Muscle Explorer)

一個純前端的網頁:中央是一個可旋轉的 **3D 人體肌肉模型**,點擊任一塊肌肉,右側面板就會列出**最適合訓練那塊肌肉的動作**(含器材、難度、分解步驟)。作品集用途。

<!-- TODO: 補一張截圖 docs/screenshot.png 後,取消下一行註解 -->
<!-- ![screenshot](docs/screenshot.png) -->

## 技術棧

| 項目 | 選擇 |
|---|---|
| Framework | Vite + React + TypeScript |
| 3D | React Three Fiber (`@react-three/fiber`) |
| 3D helpers | `@react-three/drei`(`useGLTF` / `OrbitControls` / `Bounds`) |
| 樣式 | Tailwind CSS v4 |
| 部署 | Vercel |

## 這個專案怎麼運作

三套命名彼此不一致,靠一層對照橋接:

```
GLB mesh 名稱 (467, 解剖學)  →  muscleId (12, 訓練導向)  →  free-exercise-db 肌肉字串
left_latissimus_dorsi           lats                        lats
```

- [`src/data/muscleMap.ts`](src/data/muscleMap.ts) — mesh 名稱子字串 → 12 個訓練肌群 → exercise-db 字串的對照表
- [`src/data/muscleNameZh.ts`](src/data/muscleNameZh.ts) — 467 個 mesh 的中文肌肉名對照(顯示用)
- [`src/lib/recommend.ts`](src/lib/recommend.ts) — 點到的 mesh → 肌群 → 排序後的動作清單(主要 > 輔助,compound 優先,難度由淺入深)
- [`src/components/AnatomyModel.tsx`](src/components/AnatomyModel.tsx) — 載入 GLB、逐塊點選判定(位移 < 5px 才算點選)、選中高亮

> 注意:three.js 載入 GLB 時會把名稱空格換成底線(`left latissimus dorsi` → `left_latissimus_dorsi`),比對前需先還原空格。

## 跑起來

```bash
npm install
npm run dev      # 開發伺服器 http://localhost:5173
npm run build    # 產出 dist/
npm run preview  # 預覽 build 結果
```

## 資產前處理

3D 模型借用開源專案 [`JohanBellander/BodyExplorer`](https://github.com/JohanBellander/BodyExplorer)(MIT,僅借資產)的 `anatomy.glb`,用 gltf-transform 以 meshopt 壓縮:

```bash
# 關鍵:--join false 保留 467 個獨立 mesh(否則點選會失效);
# --simplify false 保留原始幾何(避免薄片肌肉破損,且此模型再簡化幾乎不省空間)
npx @gltf-transform/cli optimize <src>.glb public/anatomy.glb --compress meshopt --join false --simplify false
# 25.13 MB → 6.88 MB
```

動作資料庫用 [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset)(ExerciseDB,MIT,1324 個動作 + GIF),精簡必要欄位後打包進 `src/data/exercisedb.json`。每個資料庫是 `src/lib/providers/` 下一個獨立 provider,方便替換。

## 授權

本專案原始碼可自訂授權(CC BY-SA 只約束模型資產,不傳染到程式碼)。

- **Anatomy model**: BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 JP) / Z-Anatomy (CC BY-SA 4.0)
- **Exercise data**: ExerciseDB — hasaneyldrm/exercises-dataset (MIT)
