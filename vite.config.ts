/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { content } from './src/data/content.ts'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Fills %SITE_*% placeholders in the HTML entry points from src/data/content.ts. */
function siteMeta(): Plugin {
  const values: Record<string, string> = {
    '%SITE_TITLE%': content.site.title,
    '%SITE_DESCRIPTION%': content.site.description,
    '%SITE_URL%': content.site.url,
    '%SITE_NAME%': content.profile.name,
  }
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(key, escapeHtml(value)), html)
    },
  }
}

// `base: './'` keeps every URL relative, so the same build works on a
// GitHub Pages project site (/portfolio/), a custom domain, or any sub-path.
export default defineConfig({
  base: './',
  plugins: [react(), siteMeta()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        resume: resolve(import.meta.dirname, 'resume/index.html'),
      },
    },
  },
  worker: { format: 'es' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
