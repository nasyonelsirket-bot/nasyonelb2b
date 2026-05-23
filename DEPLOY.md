# Canlı siteye güncelleme yükleme

Kod bilgisayarınızda güncellendi; **canlı sitede görünmesi için yeniden deploy şart.**

## Güncelleme geldi mi kontrol

Sayfanın en altında (footer): **Site sürümü: 2026.05.21-perakende-v1** yazmalı.

Üst bant: **500 TL üzeri kargo bedava**  
Sepet: 3 adım (Sepet → Teslimat → Ödeme), IBAN / Kapıda ödeme  
Admin: **Siparişler** sekmesi

---

## Netlify (Git bağlıysa)

1. Projeyi GitHub’a push edin (`nasyonelb2b-main` klasörünün içindeki proje)
2. Netlify otomatik build yapar
3. **Site settings → Environment variables** (canlıda da ekleyin):
   - `RESEND_API_KEY` — [Resend.com](https://resend.com) API anahtarı
   - `RESEND_FROM_EMAIL` — örn. `siparis@nasyoneltoys.com` (domain Resend’de doğrulanmalı)
   - `ORDER_NOTIFY_EMAIL` — size gelen sipariş bildirimi, örn. `info@nasyoneltoys.com`
   - `TRENDYOL_PRICE_DIVISOR` = `2`
   - Değişkenlerden sonra **Clear cache and deploy**

   E-posta kurulum detayı: `docs/EMAIL_SETUP.md`  
   Admin → Ayarlar → **E-posta durumunu kontrol et**

## Netlify (manuel / drag & drop)

```powershell
cd c:\Users\UserX\Desktop\nasyonelb2b-main\nasyonelb2b-main
npm ci
npm run build
```

`dist` klasörünü Netlify **Deploys → Deploy manually** ile yükleyin.

**Önemli:** Netlify **Functions** için `netlify/functions` klasörü de repoda olmalı; sadece `dist` yüklemek API’leri (sipariş, e-posta) çalıştırmaz. En iyisi Git ile tam proje deploy.

## Yerel önizleme

```powershell
cd c:\Users\UserX\Desktop\nasyonelb2b-main\nasyonelb2b-main
npm run dev
```

Tarayıcı: http://localhost:5173

## Sık nedenler (eski site görünür)

| Neden | Çözüm |
|--------|--------|
| Deploy yapılmadı | `npm run build` + Netlify deploy |
| Yanlış klasör | Deploy **`nasyonelb2b-main\nasyonelb2b-main`** (içteki proje) |
| Tarayıcı önbelleği | Ctrl+F5 veya gizli pencere |
| Eski `dist` | `npm run build` ile yeniden üretin |
| Netlify başka branch | Doğru branch’i deploy edin |
