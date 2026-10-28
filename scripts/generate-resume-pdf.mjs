#!/usr/bin/env node
/**
 * Regenerates public/resume.pdf from the /resume/ page.
 *
 *   npm run resume:pdf
 *
 * Starts a Vite dev server in-process (no build needed), opens
 * /resume/?print in headless Chromium via Playwright and prints one A4 page.
 * Run it after editing src/data/content.ts so the PDF matches the site.
 *
 * Needs Playwright with Chromium. If it is not installed:
 *   npm i -D playwright && npx playwright install chromium
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { createServer as createNetServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'public', 'resume.pdf')

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    /* fall through to a global install */
  }
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim()
    const entry = join(globalRoot, 'playwright', 'index.mjs')
    if (existsSync(entry)) return await import(pathToFileURL(entry).href)
  } catch {
    /* ignore */
  }
  console.error(
    'Playwright is not installed.\n' +
      'Install it with:  npm i -D playwright && npx playwright install chromium\n' +
      'then run:         npm run resume:pdf',
  )
  process.exit(1)
}

function freePort() {
  return new Promise((res, rej) => {
    const srv = createNetServer()
    srv.unref()
    srv.on('error', rej)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => res(port))
    })
  })
}

const { chromium } = await loadPlaywright()
const port = await freePort()
const server = await createServer({
  root,
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false },
})
await server.listen()

let browser
try {
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1024, height: 1400 } })
  const url = `http://127.0.0.1:${port}/resume/?print`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('.resume-doc')
  await page.evaluate(() => document.fonts.ready)
  await page.emulateMedia({ media: 'print' })

  mkdirSync(dirname(outFile), { recursive: true })
  await page.pdf({
    path: outFile,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  })

  // Warn if the content no longer fits on one page.
  const overflow = await page.evaluate(() => {
    const doc = document.querySelector('.resume-doc')
    return doc ? doc.scrollHeight - doc.clientHeight : 0
  })
  if (overflow > 1) {
    console.warn(`Warning: the resume overflows one A4 page by ~${Math.round(overflow)}px. Trim content in src/data/content.ts.`)
  }
  console.log(`Wrote ${outFile}`)
} finally {
  await browser?.close()
  await server.close()
}
