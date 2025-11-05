# 🚀 En Ucuza Kargo - Deployment Rehberi

Bu proje için 2 farklı deployment seçeneği mevcuttur.

## 📦 Seçenek 1: Tek Servis (Önerilen - FREE Tier)

**Dosya:** `render.yaml`

**Avantajlar:**
- ✅ Tek deployment (basit)
- ✅ FREE tier uyumlu
- ✅ CORS sorunu yok
- ✅ Tek URL yönetimi

**Yapı:**
- Backend + Frontend birlikte
- Backend, React build dosyalarını serve eder
- Tek URL: `https://enucuzakargo.onrender.com`

**Kullanım:**
1. GitHub'a push yapın
2. Render Dashboard → "New +" → "Blueprint"
3. Repository seçin
4. "Apply" tıklayın

**Environment Variables:**
- `PYTHON_VERSION`: 3.11.0
- `NODE_VERSION`: 18.17.0
- `MONGO_URL`: Database connection (otomatik)
- `CORS_ORIGINS`: * (aynı domain olduğu için)

---

## 📦 Seçenek 2: 3 Ayrı Servis (Gelişmiş - Ücretli)

**Dosya:** `render-multi-service.yaml`

**Avantajlar:**
- ✅ Bağımsız scaling
- ✅ Ayrı deployment
- ✅ Frontend CDN avantajı

**Dezavantajlar:**
- ⚠️ 2 web service = ~$14/ay
- ⚠️ CORS yapılandırması gerekli

**Yapı:**
- Backend: `enucuzakargo-backend.onrender.com`
- Frontend: `enucuzakargo-frontend.onrender.com`
- Database: `enucuzakargo-mongodb` (private)

**Kullanım:**
1. `render.yaml` → `render-backup.yaml` olarak yedekle
2. `render-multi-service.yaml` → `render.yaml` olarak kopyala
3. GitHub'a push yapın
4. Render Dashboard → "New +" → "Blueprint"
5. "Apply" tıklayın

**Environment Variables:**
- Backend CORS_ORIGINS: `https://enucuzakargo-frontend.onrender.com`
- Frontend REACT_APP_BACKEND_URL: `https://enucuzakargo-backend.onrender.com`

---

## 🔄 Geçiş Yapmak İçin

### Tek Servis → 3 Servis

```bash
# Yedekleme
cp render.yaml render-single-service.yaml

# Multi-service aktif et
cp render-multi-service.yaml render.yaml

# Git'e push
git add .
git commit -m "Switch to multi-service deployment"
git push
```

### 3 Servis → Tek Servis

```bash
# Multi-service yedekle
cp render.yaml render-multi-service.yaml

# Single-service aktif et
cp render-single-service.yaml render.yaml

# Git'e push
git add .
git commit -m "Switch to single-service deployment"
git push
```

---

## 🗄️ Database

Her iki seçenekte de aynı MongoDB kullanılır:
- **Name:** enucuzakargo-mongodb
- **Database:** kargo_db
- **Connection:** Otomatik (render.yaml'den)

---

## 🛠️ Teknik Detaylar

### Tek Servis Mimarisi

```
┌─────────────────────────────────────┐
│  enucuzakargo.onrender.com          │
│                                     │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  FastAPI    │→ │ React Build  │ │
│  │  (Backend)  │  │  (Frontend)  │ │
│  └─────────────┘  └──────────────┘ │
│         ↓                           │
│  ┌─────────────────────────────┐   │
│  │  Socket.IO                  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
           ↓
    MongoDB Database
```

### Multi-Service Mimarisi

```
┌────────────────────────────┐
│ enucuzakargo-frontend      │
│ (React - Static/Web)       │
└────────────────────────────┘
           ↓ API Calls
┌────────────────────────────┐
│ enucuzakargo-backend       │
│ (FastAPI + Socket.IO)      │
└────────────────────────────┘
           ↓
┌────────────────────────────┐
│ enucuzakargo-mongodb       │
│ (MongoDB Database)         │
└────────────────────────────┘
```

---

## 📝 Notlar

- İlk deployment 5-10 dakika sürebilir
- Free tier servisleri 15 dakika inactivity sonrası sleep moduna geçer
- MongoDB ipAllowList boş = tüm IP'lere izin (güvenlik için production'da düzenleyin)
- Socket.IO her iki yapıda da çalışır

---

## 🆘 Sorun Giderme

### Build Hatası
- Build loglarını kontrol edin
- `requirements.txt` ve `package.json` güncel mi?

### CORS Hatası
- Multi-service'te `CORS_ORIGINS` environment variable'ı kontrol edin
- Tek serviste CORS sorunu olmamalı

### Database Bağlantı Hatası
- MongoDB servisinin çalıştığından emin olun
- `MONGO_URL` environment variable'ı otomatik set ediliyor mu?

### Frontend Görünmüyor
- Tek servis: Backend loglarında "frontend build" klasörünü bulduğunu kontrol edin
- Multi-service: Frontend servisinin build başarılı mı?

---

## 📞 Destek

Render Dashboard → Logs bölümünden detaylı hata mesajlarını görüntüleyebilirsiniz.
