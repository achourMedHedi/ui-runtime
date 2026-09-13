import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom'],
    // Point straight at the workspace packages' TS source instead of their
    // built dist/ output. The dist files only live under node_modules
    // (via yarn's `portal:` symlinks), and Vite's dev-server watcher can't
    // reliably follow a symlink that points outside the project root, so
    // rebuilds of packages/react or packages/core never trigger a reload.
    // Aliasing to source sidesteps that entirely and gets real HMR too.
    alias: {
      'ur-react': path.resolve(__dirname, '../packages/react/index.tsx'),
      core: path.resolve(__dirname, '../packages/core/index.ts'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
