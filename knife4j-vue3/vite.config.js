import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 相对资源路径适配 Servlet 上下文路径与离线部署。
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [vue()],
  build: { outDir: 'dist', rollupOptions: { output: {
    entryFileNames: 'openapi-ui/assets/[name]-[hash].js',
    chunkFileNames: 'openapi-ui/assets/[name]-[hash].js',
    assetFileNames: 'openapi-ui/assets/[name]-[hash].[ext]'
  } } }
})
