# E-posta sistemi (Resend) — Kurulum

Sipariş tamamlanınca iki e-posta gider:

1. **Müşteriye** — sipariş onayı (müşterinin girdiği e-posta)
2. **Size** — yeni sipariş bildirimi (`ORDER_NOTIFY_EMAIL`)

Kod hazır; **Netlify ortam değişkenleri** tanımlanmadan e-posta gönderilmez.

---

## 1. Resend hesabı

1. https://resend.com adresinde ücretsiz hesap açın
2. **API Keys** → **Create API Key** → anahtarı kopyalayın (`re_...`)

---

## 2. Gönderen domain (önemli)

Üretimde `siparis@nasyoneltoys.com` gibi **kendi domaininizden** göndermek için:

1. Resend → **Domains** → **Add Domain** → `nasyoneltoys.com`
2. Verilen **DNS kayıtlarını** (SPF, DKIM) domain panelinize ekleyin
3. Resend’de **Verified** olana kadar bekleyin

Domain doğrulanmadan yalnızca test adreslerine veya `onboarding@resend.dev` ile sınırlı gönderim yapılır.

---

## 3. Netlify ortam değişkenleri

**Netlify** → siteniz → **Site configuration** → **Environment variables** → **Add a variable**

| Değişken | Örnek | Açıklama |
|----------|--------|----------|
| `RESEND_API_KEY` | `re_xxxxxxxx` | Resend API anahtarı |
| `RESEND_FROM_EMAIL` | `siparis@nasyoneltoys.com` | Gönderen (domain doğrulanmış olmalı) |
| `ORDER_NOTIFY_EMAIL` | `info@nasyoneltoys.com` | Yeni sipariş bildirimi size gelsin |

- **Scopes:** Production (ve isteğe bağlı Deploy previews)
- Kaydettikten sonra: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## 4. Admin panel ayarı

**Admin → Ayarlar** → **E-posta (sipariş bildirimi)** = `info@nasyoneltoys.com` (veya bildirim alacağınız adres)

**Site URL** = `https://www.nasyoneltoys.com` (e-postadaki logo/PDF linkleri için)

---

## 5. Yerel test (bilgisayarınızda)

Proje klasöründe `.env` dosyası oluşturun (`.env.example` örneğine bakın):

```
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=siparis@nasyoneltoys.com
ORDER_NOTIFY_EMAIL=info@nasyoneltoys.com
```

Sonra `npm run dev` ile test siparişi verin.

---

## 6. Çalışıyor mu kontrol

1. Admin → Ayarlar → **E-posta durumunu kontrol et**
2. Canlı sitede küçük bir test siparişi verin
3. Sepet mesajında «Onay e-postası gönderildi» görünmeli
4. Görünmüyorsa: «E-posta: Resend ayarlarını kontrol edin» → Netlify değişkenleri veya domain doğrulama eksik

---

## Sık sorunlar

| Belirti | Çözüm |
|---------|--------|
| E-posta hiç gitmiyor | `RESEND_API_KEY` Netlify’da yok veya deploy yenilenmedi |
| Sadece size gitmiyor | `ORDER_NOTIFY_EMAIL` ekleyin |
| Müşteriye gitmiyor | Siparişte e-posta dolu mu; Resend domain doğrulandı mı |
| Spam’a düşüyor | Domain SPF/DKIM kayıtlarını tamamlayın |
| Yerelde çalışmıyor | `.env` + `npm run dev` yeniden başlatın |
| Sipariş var mail yok | Admin → Ayarlar → **Test gönder** — çıkan hata metnini okuyun |

### Resend’de domain “Verified” değilse
Mail **hiç gitmez**. DNS kayıtlarından sonra Resend’de yeşil **Verified** bekleyin.

### Netlify env sonrası deploy unutulursa
Değişkenleri ekledikten sonra mutlaka **Clear cache and deploy site**.

### `RESEND_FROM_EMAIL` yanlışsa
Sadece doğrulanmış adresten gönderin: `siparis@nasyoneltoys.com` (Resend’de onaylı subdomain `send` yeterli).
