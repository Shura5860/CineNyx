# CineNyx 🎬🍿

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3_Storage-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![PrimeNG](https://img.shields.io/badge/UI-PrimeNG_21-06B6D4?style=for-the-badge&logo=primeng&logoColor=white)](https://primeng.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**CineNyx**, modern web standartları ve ölçeklenebilir mikro-mimari prensipleri doğrultusunda geliştirilmiş, uçtan uca **Full-Stack Medya Akış (Video Streaming) ve İçerik Yönetim Platformudur**.

Gelişmiş video oynatıcı motoru, dinamik çoklu ses/altyazı entegrasyonu, harici API senkronizasyonları (TMDB & OpenSubtitles) ve güvenli nesne depolama (AWS S3) altyapısıyla kurumsal ölçekte bir streaming deneyimi sunar.

---

## 📌 İçindekiler
- [Mimari Genel Bakış](#-mimari-genel-bakış)
- [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
- [Teknoloji Yığını (Tech Stack)](#-teknoloji-yığını-tech-stack)
- [Sistem ve Veri Akış Mimarisi](#-sistem-ve-veri-akış-mimarisi)
- [Dizin Yapısı](#-dizin-yapısı)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Ortam Değişkenleri (.env)](#-ortam-değişkenleri-env)
- [RESTful API Spesifikasyonu](#-restful-api-spesifikasyonu)
- [Güvenlik ve Performans Tasarımı](#-güvenlik-ve-performans-tasarımı)

---

## 🏗️ Mimari Genel Bakış

CineNyx, modern frontend ve backend mimarilerinin en güncel sürümleriyle tasarlanmıştır:
- **Loose Coupling (Gevşek Bağlantı):** Frontend (Angular) ve Backend (Node.js/Express) bağımsız olarak konteynerize edilebilir ve ölçeklenebilir.
- **Güvenli Streaming Pipeline:** Medya içeriklerinin doğrudan sunucuyu yormaması adına AWS S3 Presigned URL mekanizması ile istemciye güvenli ve süreli akış sağlanır.
- **Otomasyon & Senkronizasyon:** TMDB entegrasyonu ile zengin metadata, afişler ve oyuncu bilgileri; OpenSubtitles entegrasyonu ile dinamik altyazı desteği sağlanır.

---

## 🚀 Öne Çıkan Özellikler

### 1. İstemci Deneyimi (Frontend & Streaming Engine)
- **Özel Video Player Engine:** 
  - Çoklu ses parçası (Multi-track audio) ve altyazı seçimi.
  - Oynatma hızı kontrolleri, tamponlama (buffering) yönetimi, klavye kısayolları.
  - İlerleme kaydı (Kullanıcı izleme geçmişi ve kaldığı yerden devam etme).
- **Zengin Keşif Arayüzü:** Kategori, ülke, tür ve yayın yılına göre filtrelenebilir film/dizi katalogları.
- **PrimeNG Tabanlı Modern UI/UX:** Akıcı geçişler, duyarlı (responsive) tasarım ve modern koyu tema.

### 2. Yönetim ve İçerik Altyapısı (Admin Panel)
- **Kapsamlı İçerik Yönetimi:** Film ve Dizi/Sezon/Bölüm hiyerarşisinde CRUD işlemleri.
- **Otomatik Metadata Çekme:** TMDB ID girilerek afiş, arka plan görseli, özet ve tür verilerinin otomatik senkronizasyonu.
- **Doğrudan S3 Medya Yükleyici:** Chunked / Multipart upload optimizasyonuyla S3 üzerine poster, fragman ve medya dosyası yükleme.
- **Kullanıcı & Yorum Moderasyonu:** Kullanıcı yetkilendirmesi ve izleyici yorumlarının denetimi.

### 3. Backend & Veri Yönetimi
- **JWT Tabanlı Çift Katmanlı Kimlik Doğrulama:** HttpOnly Cookie ve Bearer token ile XSS/CSRF saldırılarına karşı korumalı oturum yönetimi.
- **Dinamik Presigned URL Üretimi:** Video kaynaklarının çalınmasını engellemek için süre sınırlı imzalı URL üretimi.
- **Toplu Veri Senkronizasyon Scriptleri:** Ülkeler, türler ve altyazı opsiyonları için arka plan eşitleme scriptleri.

---

## 💻 Teknoloji Yığını (Tech Stack)

### Frontend
- **Framework:** Angular 21 (Zoneless-ready, Standalone Components, Signals)
- **UI Kütüphanesi:** PrimeNG 21 + PrimeIcons
- **State & Veri Akışı:** RxJS 7.8, Signals tabanlı reaktif durum yönetimi
- **Grafikler & İstatistikler:** Chart.js
- **Test Altyapısı:** Vitest & JSDOM

### Backend
- **Çalışma Zamanı (Runtime):** Node.js (ES Modules)
- **Web Framework:** Express 5.x
- **Veritabanı / ODM:** MongoDB & Mongoose 9.x
- **Depolama & Bulut:** AWS S3 SDK (v2), Multer-S3
- **Güvenlik & Auth:** JSON Web Tokens (JWT), BcryptJS, Cookie-Parser, CORS Policy
- **Medya İşleme:** Fluent-FFmpeg entegrasyonu

---

## 📐 Sistem ve Veri Akış Mimarisi

```mermaid
flowchart TD
    subgraph Client["İstemci (Angular 21)"]
        UI[Kullanıcı & Admin Arayüzü]
        Player[Özel Video Player Engine]
    end

    subgraph Backend["API Katmanı (Express 5 & Node.js)"]
        AuthMid[Auth & Role Guard Middleware]
        Controllers[API Denetleyicileri]
        S3Signer[Presigned URL Servisi]
    end

    subgraph Data["Veri & Nesne Depolama"]
        Mongo[(MongoDB)]
        S3[("AWS S3 Bucket (Medya & Altyazılar)")]
    end

    subgraph External["Harici Entegrasyonlar"]
        TMDB[TMDB API v3]
        OS[OpenSubtitles API]
    end

    UI -->|REST İstekleri / JWT Cookie| AuthMid
    AuthMid --> Controllers
    Controllers -->|CRUD & Metadata| Mongo
    Controllers -->|Metadata Sync| TMDB
    Controllers -->|Altyazı Arama| OS
    Controllers -->|Yetkili İmza Üretimi| S3Signer
    S3Signer -->|Kısa Ömürlü Presigned URL| Player
    Player -.->|Doğrudan Akış (Direct Stream)| S3
```

---

## 📁 Dizin Yapısı

```bash
CineNyx/
├── CineNyxBackend/               # Node.js / Express API Servisi
│   ├── config/                   # Veritabanı ve bulut servis konfigürasyonları
│   ├── controllers/              # İş mantığı (Auth, Content, Comment, Upload vb.)
│   ├── helpers/                  # Presigned URL, TMDB yardımcı fonksiyonları, Token üreticiler
│   ├── middleware/               # Kimlik doğrulama ve dosya yükleme filtreleri
│   ├── models/                   # Mongoose şemaları (User, Content, Series, Comment vb.)
│   ├── routers/                  # Express RESTful endpoint rotaları
│   ├── Scripts/                  # TMDB ve referans veri senkronizasyon araçları
│   ├── server.js                 # Sunucu başlangıç noktası
│   └── package.json
│
└── CineNyxFrontend/              # Angular 21 İstemci Uygulaması
    ├── src/
    │   ├── app/
    │   │   ├── adminPages/       # İçerik, film, dizi, kullanıcı yönetim modülleri
    │   │   ├── userPages/        # Keşfet, ana sayfa, profil, film/dizi listeleri
    │   │   ├── player/           # Gelişmiş Video Player bileşeni ve kontrolleri
    │   │   ├── services/         # Reaktif API ve HTTP servis katmanı
    │   │   └── config/           # API ve global ortam sabitleri
    │   ├── styles.css            # Global tema ve PrimeNG özelleştirmeleri
    │   └── main.ts
    └── package.json
```

---

## ⚙️ Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** `>= 20.x`
- **npm:** `>= 10.x`
- **MongoDB:** Yerel veya MongoDB Atlas bağlantısı
- **AWS S3:** Medya depolama ve presigned URL için geçerli AWS IAM anahtarları

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullanici-adi/CineNyx.git
cd CineNyx
```

### 2. Backend Kurulumu
```bash
cd CineNyxBackend
npm install

# .env dosyasını oluşturun ve yapılandırın
cp .env.example .env

# Geliştirme sunucusunu başlatın
npm run dev
```
> Backend varsayılan olarak `http://localhost:3000` portunda ayağa kalkacaktır.

### 3. Frontend Kurulumu
```bash
cd ../CineNyxFrontend
npm install

# İstemciyi başlatın
npm start
```
> Frontend varsayılan olarak `http://localhost:4200` adresinde çalışacaktır.

---

## 🔐 Ortam Değişkenleri (.env)

`CineNyxBackend/.env` dosyası için gerekli minimum yapılandırma:

```env
# Sunucu Ayarları
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

# Veritabanı
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cinenyx?retryWrites=true&w=majority

# JWT Güvenlik
JWT_SECRET=super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_COOKIE=10080

# AWS S3 Depolama
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=cinenyx-media-bucket

# Harici API'lar
TMDB_API_KEY=your_tmdb_api_key
OPENSUBTITLES_API_KEY=your_opensubtitles_api_key
```

---

## 📡 RESTful API Spesifikasyonu

Tüm API istekleri `/api` ön eki ile karşılanır. Detaylı döküman için [`CineNyxBackend/README.md`](file:///home/shura/Projects/CineNyx/CineNyx/CineNyxBackend/README.md) dosyasını inceleyebilirsiniz.

| Modül | Metod | Endpoint | Açıklama |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Yeni kullanıcı kaydı ve JWT oluşturma |
| **Auth** | `POST` | `/api/auth/login` | Giriş işlemi ve HttpOnly cookie atama |
| **Auth** | `GET` | `/api/auth/logout` | Oturum kapatma (Cookie temizleme) |
| **Content** | `GET` | `/api/content` | Sayfalanmış film ve dizi listeleme |
| **Content** | `GET` | `/api/content/:id` | İçerik detay, oyuncular ve video kaynakları |
| **Content** | `POST` | `/api/content` | Yeni film/dizi kaydı (Admin) |
| **Content** | `PUT` | `/api/content/:id` | İçerik güncelleme (Admin) |
| **Content** | `DELETE`| `/api/content/:id` | İçerik silme (Admin) |
| **Stream** | `GET` | `/api/content/:id/stream`| S3 Presigned URL üretimi ve güvenli akış |
| **Upload** | `POST` | `/api/upload` | S3 üzerine poster/altyazı/dosya yükleme |
| **Comments**| `GET` | `/api/comments/:contentId` | İçeriğe ait kullanıcı yorumlarını listeleme |
| **Comments**| `POST` | `/api/comments/:contentId` | Yeni yorum ekleme |
| **User** | `GET` | `/api/user/profile` | Profil ve izleme geçmişi verileri |

---

## 🛡️ Güvenlik ve Performans Tasarımı

1. **Doğrudan Akış Koruması:** Medya nesneleri kamuya açık (public) tutulmaz. Sadece oturumu doğrulanmış kullanıcılara belirli bir TTL (Time-To-Live) süresine sahip AWS S3 Presigned URL'ler sağlanır.
2. **XSS & CSRF Koruması:** Token verileri tarayıcının `localStorage` alanı yerine `HttpOnly`, `SameSite` bayrakları barındıran çerezler aracılığıyla taşınır.
3. **CORS Katı Politikası:** Geliştirme ve üretim ortamları ayrıştırılarak yalnızca güvenilir istemci kökenlerine (Origins) erişim hakkı tanınır.
4. **Veritabanı İndeksleme:** Sık sorgulanan slug, kategori ve IMDB/TMDB kimlikleri MongoDB üzerinde optimize edilmiş indekslerle sorgulanır.

---

## 👨‍💻 Yazar & İletişim

- **Proje Geliştiricisi:** [Adınız Soyadınız]
- **LinkedIn:** [linkedin.com/in/profiliniz](https://linkedin.com)
- **E-posta:** iletisim@epostaniz.com
