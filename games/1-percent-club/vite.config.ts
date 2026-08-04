import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const platformSrc = fileURLToPath(new URL('../../packages/platform/src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // Read env (VITE_SUPABASE_*) from the repo root, not just this game folder.
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/Games/1-percent-club/' : '/',
  resolve: {
    alias: {
      // Consume the platform package from source so the React plugin transforms
      // its JSX (aliasing to a real path keeps it out of node_modules handling).
      '@games/platform/theme.css': `${platformSrc}/theme.css`,
      '@games/platform/styles.css': `${platformSrc}/styles.css`,
      '@games/platform': `${platformSrc}/index.ts`,
    },
  },
})
