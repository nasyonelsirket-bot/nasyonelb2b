import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const require = createRequire(import.meta.url)
const { syncTrendyolProducts } = require('./lib/trendyolSync.cjs')
const { generateOrderPdfBuffer } = require('./lib/orderPdfServer.cjs')

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

function catalogDevProxy(env) {
  const adminPass = env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD || 'admin123'
  const catalogFile = path.join(process.cwd(), '.data', 'catalog.json')

  return {
    name: 'catalog-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/catalog/save', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        let body = {}
        try {
          body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
          return
        }

        const given = String(body.password || '').trim()
        if (given !== String(adminPass).trim()) {
          res.statusCode = 401
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Yetkisiz',
              hint: `Yerel: .env dosyasında ADMIN_PASSWORD veya VITE_ADMIN_PASSWORD = "${adminPass}" olmalı`,
            }),
          )
          return
        }

        const payload = {
          products: body.products || [],
          categories: body.categories || [],
          banners: body.banners || [],
          settings: body.settings || null,
          updatedAt: new Date().toISOString(),
        }
        fs.mkdirSync(path.dirname(catalogFile), { recursive: true })
        fs.writeFileSync(catalogFile, JSON.stringify(payload))

        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            ok: true,
            productCount: payload.products.length,
            updatedAt: payload.updatedAt,
          }),
        )
      })

      server.middlewares.use('/api/catalog', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.url?.includes('/save')) return

        res.setHeader('Content-Type', 'application/json')
        if (!fs.existsSync(catalogFile)) {
          res.end(JSON.stringify({ products: [], categories: [], banners: [], settings: null }))
          return
        }
        res.end(fs.readFileSync(catalogFile, 'utf8'))
      })
    },
  }
}

function orderPdfDevProxy() {
  const ordersDir = path.join(process.cwd(), '.data', 'orders')

  return {
    name: 'order-pdf-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/order-pdf/save', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        let body = {}
        try {
          body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
          return
        }

        const items = Array.isArray(body.items) ? body.items : []
        if (!items.length) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Sipariş boş' }))
          return
        }

        const id = crypto.randomBytes(10).toString('hex')
        const payload = {
          ...body,
          items,
          createdAt: new Date().toISOString(),
        }
        fs.mkdirSync(ordersDir, { recursive: true })
        fs.writeFileSync(path.join(ordersDir, `${id}.json`), JSON.stringify(payload))

        const host = req.headers.host || 'localhost:5173'
        const url = `http://${host}/api/order-pdf?id=${id}`
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, id, url }))
      })

      server.middlewares.use('/api/order-pdf', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.url?.includes('/save')) return

        const url = new URL(req.url, 'http://localhost')
        const id = url.searchParams.get('id')
        if (!id) {
          res.statusCode = 400
          res.end('id gerekli')
          return
        }

        const jsonPath = path.join(ordersDir, `${id}.json`)
        if (!fs.existsSync(jsonPath)) {
          res.statusCode = 404
          res.end('Bulunamadı')
          return
        }

        const order = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
        const pdfBuffer = generateOrderPdfBuffer(order)
        res.setHeader('Content-Type', 'application/pdf')
        res.end(pdfBuffer)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [react(), tailwindcss(), trendyolDevProxy(), catalogDevProxy(env), orderPdfDevProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}
})
