import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const require = createRequire(import.meta.url)
const { syncTrendyolProducts, syncTrendyolCatalogWithSales } = require('./lib/trendyolSync.cjs')
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
        const mode = url.searchParams.get('mode') || 'page'

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
          const result =
            mode === 'full'
              ? await syncTrendyolCatalogWithSales(body, { size })
              : await syncTrendyolProducts(body, { page, size })
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

        const { sanitizeProductsSeo } = require('./lib/productSeo.cjs')
        const payload = {
          products: sanitizeProductsSeo(body.products || []),
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

function applyResendEnv(env = {}) {
  if (env.RESEND_API_KEY) process.env.RESEND_API_KEY = env.RESEND_API_KEY
  if (env.RESEND_FROM_EMAIL) process.env.RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL
  if (env.ORDER_NOTIFY_EMAIL) process.env.ORDER_NOTIFY_EMAIL = env.ORDER_NOTIFY_EMAIL
}

function membersDevProxy() {
  const membersDir = path.join(process.cwd(), '.data', 'members')
  const {
    createFileStorage,
    registerMember,
    loginMember,
    listMembers,
  } = require('./lib/members.cjs')
  const { verifyAdmin } = require('./lib/adminAuth.cjs')

  async function readJsonBody(req) {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    return JSON.parse(Buffer.concat(chunks).toString() || '{}')
  }

  function sendJson(res, status, data) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  return {
    name: 'members-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/members/register', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        try {
          const body = await readJsonBody(req)
          const result = await registerMember(createFileStorage(membersDir), body)
          if (!result.ok) {
            sendJson(res, result.status, { error: result.error, code: result.code })
            return
          }
          sendJson(res, 201, { ok: true, member: result.member })
        } catch (err) {
          sendJson(res, 500, { error: err.message || 'Kayıt başarısız' })
        }
      })

      server.middlewares.use('/api/members/login', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        try {
          const body = await readJsonBody(req)
          const result = await loginMember(createFileStorage(membersDir), body)
          if (!result.ok) {
            sendJson(res, result.status, { error: result.error, code: result.code })
            return
          }
          sendJson(res, 200, { ok: true, member: result.member })
        } catch (err) {
          sendJson(res, 500, { error: err.message || 'Giriş başarısız' })
        }
      })

      server.middlewares.use('/api/members/list', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }
        if (!verifyAdmin(req.headers)) {
          sendJson(res, 401, { error: 'Yetkisiz' })
          return
        }
        try {
          const members = await listMembers(createFileStorage(membersDir))
          sendJson(res, 200, { members, count: members.length })
        } catch (err) {
          sendJson(res, 500, { error: err.message || 'Liste alınamadı' })
        }
      })
    },
  }
}

function orderPdfDevProxy(env = {}) {
  const ordersDir = path.join(process.cwd(), '.data', 'orders')
  applyResendEnv(env)

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
        const customer = body.customer || {}
        const customerName = String(customer.name || customer.companyName || '').trim()
        const orderNumber = body.orderNumber || `NT-${Date.now().toString(36).toUpperCase().slice(-8)}`
        const paymentMethod = body.paymentMethod === 'iban' ? 'iban' : 'cod'
        const host = req.headers.host || 'localhost:5173'
        const proto = req.headers['x-forwarded-proto'] || 'http'
        const base = `${proto}://${host}`.replace(/\/$/, '')
        const pdfUrl = `${base}/api/order-pdf?id=${id}`
        const payload = {
          ...body,
          id,
          orderNumber,
          siteUrl: body.siteUrl || base,
          siteLogoUrl: body.siteLogoUrl || '',
          pdfUrl,
          customer: { ...customer, name: customerName },
          items,
          paymentMethod,
          status: paymentMethod === 'iban' ? 'pending_iban_check' : 'pending_cod',
          createdAt: new Date().toISOString(),
        }
        fs.mkdirSync(ordersDir, { recursive: true })
        fs.writeFileSync(path.join(ordersDir, `${id}.json`), JSON.stringify(payload))

        const indexPath = path.join(ordersDir, '_index.json')
        let index = []
        try {
          if (fs.existsSync(indexPath)) index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
        } catch {
          index = []
        }
        if (!Array.isArray(index)) index = []
        index.unshift({
          id,
          orderNumber,
          createdAt: payload.createdAt,
          customerName,
          customerEmail: customer.email,
          orderTotal: payload.orderTotal,
          paymentMethod,
          status: payload.status,
          itemCount: items.length,
        })
        fs.writeFileSync(indexPath, JSON.stringify(index.slice(0, 500)))

        let emailResult = { skipped: true }
        try {
          const { sendOrderEmails } = require('./lib/orderEmail.cjs')
          emailResult = await sendOrderEmails(payload, {
            pdfUrl,
            siteUrl: payload.siteUrl,
          })
        } catch (emailErr) {
          console.error('[dev] order email:', emailErr)
          emailResult = { ok: false, error: emailErr.message }
        }

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, id, orderNumber, url: pdfUrl, email: emailResult }))
      })

      server.middlewares.use('/api/orders/list', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        const indexPath = path.join(ordersDir, '_index.json')
        let orders = []
        try {
          if (fs.existsSync(indexPath)) orders = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
        } catch {
          orders = []
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ orders: Array.isArray(orders) ? orders : [] }))
      })

      server.middlewares.use('/api/orders/get', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        const url = new URL(req.url, 'http://localhost')
        const id = url.searchParams.get('id') || ''
        const jsonPath = path.join(ordersDir, `${id}.json`)
        if (!id || !fs.existsSync(jsonPath)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Sipariş bulunamadı' }))
          return
        }
        const order = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ order }))
      })

      server.middlewares.use('/api/orders/track', async (req, res) => {
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
          res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
          return
        }
        const orderNumber = String(body.orderNumber || '').trim().toUpperCase()
        const email = String(body.email || '').trim().toLowerCase()
        if (!orderNumber || !email) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Sipariş numarası ve e-posta zorunludur' }))
          return
        }
        const indexPath = path.join(ordersDir, '_index.json')
        let index = []
        try {
          if (fs.existsSync(indexPath)) index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
        } catch {
          index = []
        }
        const row = (Array.isArray(index) ? index : []).find(
          (r) =>
            String(r.orderNumber || '').toUpperCase() === orderNumber ||
            String(r.id || '').toUpperCase() === orderNumber,
        )
        if (!row) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Sipariş bulunamadı' }))
          return
        }
        const jsonPath = path.join(ordersDir, `${row.id}.json`)
        if (!fs.existsSync(jsonPath)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Sipariş bulunamadı' }))
          return
        }
        const order = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
        const orderEmail = String(order.customer?.email || '').trim().toLowerCase()
        if (orderEmail !== email) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'E-posta adresi siparişle eşleşmiyor' }))
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            ok: true,
            order: {
              orderNumber: order.orderNumber || order.id,
              status: order.status,
              createdAt: order.createdAt,
              orderTotal: order.orderTotal,
              paymentMethod: order.paymentMethod,
              shippingCarrier: order.shippingCarrier || null,
              trackingNumber: order.trackingNumber || null,
              shippedAt: order.shippedAt || null,
            },
          }),
        )
      })

      server.middlewares.use('/api/orders/update', async (req, res) => {
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
          res.end(JSON.stringify({ error: 'Geçersiz JSON' }))
          return
        }
        const id = String(body.id || '').trim()
        const status = String(body.status || '').trim()
        const jsonPath = path.join(ordersDir, `${id}.json`)
        if (!id || !status || !fs.existsSync(jsonPath)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Sipariş bulunamadı' }))
          return
        }
        const order = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
        const now = new Date().toISOString()
        order.status = status
        order.updatedAt = now
        if (status === 'cancelled') {
          order.cancelReason = String(body.cancelReason || '').trim()
          order.cancelNote = String(body.cancelNote || '').trim()
          order.cancelledAt = now
        } else if (status === 'confirmed' || status === 'iban_verified') {
          order.confirmedAt = now
        } else if (status === 'shipped') {
          order.shippedAt = now
          order.shippingCarrier = String(body.shippingCarrier || order.shippingCarrier || '').trim()
          order.trackingNumber = String(body.trackingNumber || order.trackingNumber || '').trim()
        }
        if (body.shippingCarrier != null) order.shippingCarrier = String(body.shippingCarrier).trim()
        if (body.trackingNumber != null) order.trackingNumber = String(body.trackingNumber).trim()
        fs.writeFileSync(jsonPath, JSON.stringify(order))
        const indexPath = path.join(ordersDir, '_index.json')
        if (fs.existsSync(indexPath)) {
          let index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
          if (Array.isArray(index)) {
            index = index.map((row) =>
              row.id === id
                ? { ...row, status, updatedAt: now, cancelReason: order.cancelReason || '' }
                : row,
            )
            fs.writeFileSync(indexPath, JSON.stringify(index))
          }
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, order }))
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
  plugins: [react(), tailwindcss(), trendyolDevProxy(), catalogDevProxy(env), membersDevProxy(), orderPdfDevProxy(env)],
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
