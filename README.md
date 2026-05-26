# ToyWholesale B2B — Oyuncak Toptan Katalog

Netlify üzerinde sorunsuz çalışan, statik deploy uyumlu profesyonel B2B oyuncak katalog sitesi.

## Özellikler

- Ürün kataloğu (görsel, SKU, kategori, fiyat, açıklama, yeni/kampanya etiketleri)
- Ürün bazlı **minimum sipariş adedi** (1, 5, 12, 50 vb.)
- Toplu sipariş: +1, +10, +50, +100 hızlı artırma
- WhatsApp sipariş mesajı (otomatik format)
- Admin panel (ürün, kategori, banner, logo, WhatsApp, Pixel, GA)
- Excel yükleme (client-side)
- Trendyol API altyapısı (Netlify Function)
- SEO: meta tags, Open Graph, Schema, sitemap, robots.txt
- Meta Pixel & Google Analytics

## Teknoloji

- Vite + React 19
- Tailwind CSS 4
- React Router 7
- Framer Motion
- xlsx (Excel)

## Kurulum (Yerel)

```bash
cd b2b-toy-catalog
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run dev
```

## Netlify Deploy

### Yöntem 1: GitHub + Netlify (Önerilen)

1. Projeyi GitHub repository'sine push edin
2. [Netlify](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Repository'yi seçin
4. Build ayarları (otomatik algılanır):

| Ayar | Değer |
|------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |

5. **Environment variables** ekleyin (Site settings → Environment variables):

```
VITE_WHATSAPP_NUMBER=905551234567
VITE_ADMIN_PASSWORD=guclu_sifre
VITE_GA_MEASUREMENT_ID=G-5SLP8QB6P1
VITE_GA_ID=G-5SLP8QB6P1
VITE_META_PIXEL_ID=
VITE_SITE_URL=https://nasyoneltoys.com
TRENDYOL_SUPPLIER_ID=
TRENDYOL_API_KEY=
TRENDYOL_API_SECRET=
TRENDYOL_PRICE_DIVISOR=4
```

6. Deploy

### Yöntem 2: dist klasörünü repo'ya commit

```bash
npm run build
# dist/ klasörünü commit edip Netlify'da publish directory = dist
```

## Admin Panel

- URL: `/admin`
- Varsayılan şifre: `.env` içindeki `VITE_ADMIN_PASSWORD` (örnek: `admin123`)

## Excel Formatı

| ürün adı | stok kodu | kategori | fiyat | görsel url | açıklama | minimum sipariş |
|----------|-----------|----------|-------|------------|----------|-----------------|

## Trendyol API

Netlify Functions ile çalışır. Admin panelden **Trendyol Ürünlerini Çek** butonuna basın.

Gerekli env değişkenleri Netlify dashboard'da tanımlanmalıdır. Fiyatlar `TRENDYOL_PRICE_DIVISOR` (varsayılan 4) ile bölünür.

## Dosya Yapısı

```
b2b-toy-catalog/
├── netlify.toml
├── netlify/functions/trendyol-sync.js
├── public/          # robots.txt, sitemap, logo
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── pages/
│   ├── services/
│   └── utils/
└── dist/            # npm run build çıktısı
```

## Lisans

Özel proje — ticari kullanım için geliştirilmiştir.
