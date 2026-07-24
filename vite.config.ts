import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 確保整個依賴樹只用同一份 three,避免 R3F 出現 "Multiple instances" 警告
  resolve: {
    dedupe: ['three'],
  },
  build: {
    rollupOptions: {
      output: {
        // 把幾乎不變的大型函式庫拆成獨立 chunk:改程式重新部署時,
        // 回訪者只需重抓變動的 app chunk,three 這包(永久快取)不必重下載
        manualChunks(id) {
          if (id.includes('exercisedb.json')) return 'exercise-data'
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
          return undefined
        },
      },
    },
  },
})
