import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { syncTrendyolProducts } = require('./lib/trendyolSync.cjs')

function trendyolDevProxy() {
  return {
    name: 'trendyol-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/trendyol/sync', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        const url = new URL(req.url, 'http://localhost')
        const page = url.searchParams.get('page') || '0'
        const size = url.searchParams.get('size') || '50'

        let body = {}
        if (req.method === 'POST') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
          } catch {
            body = {}
          }
        }

        try {
          const result = await syncTrendyolProducts(body, { page, size })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = err.code === 'MISSING_CREDENTIALS' ? 400 : (err.status || 500)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: err.message,
            hint: err.hint,
            details: err.details,
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), trendyolDevProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
