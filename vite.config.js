import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Base path, one clear override point (checked in this order):
 *
 * 1. VITE_BASE_PATH — explicit override. Set this to "/" (as a GitHub
 *    Actions repo variable, or in a local .env file / shell env) when
 *    moving to a custom domain or the account's root github.io page —
 *    nothing else needs to change.
 * 2. GITHUB_REPOSITORY — set automatically by GitHub Actions on every CI
 *    run ("owner/repo"), so the current GitHub Pages project-site
 *    deployment keeps working with zero edits even if the repo is renamed.
 * 3. Hardcoded fallback — matches today's live deployment; only used for
 *    local dev/build/preview when neither of the above is set.
 */
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE_PATH || (repoName ? `/${repoName}/` : '/My-Portfolio/')

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
