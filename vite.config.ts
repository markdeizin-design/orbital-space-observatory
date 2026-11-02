import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const base = '/orbital-space-observatory/'
export default defineConfig({
  base,
  cacheDir: '.vite-cache',
  plugins: [
    {
      name: 'project-pages-paths',
      enforce: 'pre',
      transform(code, id) {
        if (!/[/\\]src[/\\].*\.[jt]sx?$/.test(id)) return
        return code.replace(/(['"`])\/(assets\/)/g, `$1${base}$2`).replace(/(href=\{?['"`])\//g, `$1${base}`)
      },
      async closeBundle() {
        const html = await readFile('dist/index.html', 'utf8')
        for (const id of ['james-webb', 'hubble', 'fermi']) {
          const directory = `dist/telescopes/${id}`
          await mkdir(directory, { recursive: true })
          await writeFile(`${directory}/index.html`, html)
        }
      },
    },
    react(),
  ],
  build: { chunkSizeWarningLimit: 1100 },
})
