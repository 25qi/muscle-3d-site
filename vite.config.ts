import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  // 確保整個依賴樹只用同一份 three,避免 R3F 出現 "Multiple instances" 警告
  resolve: {
    dedupe: ['three'],
  },
})