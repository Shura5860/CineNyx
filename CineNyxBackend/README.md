# iboylaizle Backend API

Tarih: 24 Ocak 2026

Bu doküman, projedeki tüm mevcut endpoint’leri **path/method**, **parametreler**, **request body**, **dosya upload alanları** ve **örnek curl kullanımları** ile birlikte listeler.

## Base URL

- Local: `http://localhost:<PORT>`
- Tüm API’ler: `/api/*`

Örn: `http://localhost:3000/api/auth/login`

## Çalıştırma

- Geliştirme: `npm run dev`
- Doğrudan: `node --env-file=.env server.js`

## Gerekli Environment Değişkenleri

- `PORT` (opsiyonel, varsayılan: `3000`)
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRE` (örn: `1d`, `7d`)
- `JWT_COOKIE` (dakika cinsinden; cookie expires hesabında kullanılıyor)

S3 Upload için:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`

## Genel Davranışlar

- JSON body için `Content-Type: application/json`.
- Upload endpoint’leri `multipart/form-data` bekler.
- Bu projede router’larda **auth/role middleware** görünmüyor; yani endpoint’ler şu an varsayılan olarak **korumasız**.
- Auth başarılı olunca response hem JSON döner hem de `access_token` isimli **httpOnly cookie** set edilir.

### Upload dosya tipleri (middleware)
`middleware/upload.js` içinde kabul edilen MIME tipleri:

- `image/jpeg`, `image/png`, `image/webp`
- `audio/mpeg`, `audio/mp3`
- `text/vtt`, `application/x-subrip`

Not: `/api/content/:id/video` endpoint’i var; fakat middleware listesinde video MIME (örn `video/mp4`) yok. Bu durumda upload “Bu dosya tipi olmaz” hatasıyla reject edilebilir.

---

# Authentication

## POST /api/auth/register
Yeni kullanıcı kaydı.

**Body (JSON)**
- `username` (string, zorunlu)
- `email` (string, zorunlu)
- `password` (string, zorunlu)

**Başarılı Response (200)**
- `success`: `true`
- `access_token`: string
- `data`: `{ username, email, role }`
- Ayrıca cookie: `access_token` (httpOnly)

**Örnek**
```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"enes","email":"enes@example.com","password":"123456"}'
```

## POST /api/auth/login
Giriş.

**Body (JSON)**
- `username` (string, zorunlu)
- `password` (string, zorunlu)

**Başarılı Response (200)**
- `success`: `true`
- `access_token`: string
- `data`: `{ username, email, role }`
- Ayrıca cookie: `access_token` (httpOnly)

**Örnek**
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"enes","password":"123456"}'
```

## GET /api/auth/logout
Çıkış (cookie temizler).

**Response (200)**
- `success`: `true`
- `message`: `"Çıkış Başarılı"`

**Örnek**
```bash
curl -i -X GET http://localhost:3000/api/auth/logout
```

---

# Upload

Bu endpoint’ler S3’e dosya yükler ve yüklenen objenin URL’ini döner.

**Response (201)**
- `url`: string (S3 public URL)
- `key`: string (S3 object key)

## POST /api/upload/film-image
**Form-Data**
- `image`: dosya (field adı: `image`)

```bash
curl -X POST http://localhost:3000/api/upload/film-image \
  -F "image=@./poster.png"
```

## POST /api/upload/avatar
**Form-Data**
- `avatar`: dosya (field adı: `avatar`)

```bash
curl -X POST http://localhost:3000/api/upload/avatar \
  -F "avatar=@./avatar.png"
```

## POST /api/upload/subtitle
**Form-Data**
- `subtitle`: dosya (field adı: `subtitle`)

```bash
curl -X POST http://localhost:3000/api/upload/subtitle \
  -F "subtitle=@./tr.vtt"
```

## POST /api/upload/audio
**Form-Data**
- `audio`: dosya (field adı: `audio`)

```bash
curl -X POST http://localhost:3000/api/upload/audio \
  -F "audio=@./tr.mp3"
```

---

# Country
Base: `/api/country`

## GET /api/country
Tüm ülkeler (isme göre sıralı).

```bash
curl http://localhost:3000/api/country
```

## POST /api/country
Ülke oluştur.

**Body (JSON)**
- `name` (string, zorunlu)

**Response (201)**
- `step`: `"create"`
- `completed`: `false`
- `country`: oluşturulan kayıt

```bash
curl -X POST http://localhost:3000/api/country \
  -H "Content-Type: application/json" \
  -d '{"name":"Türkiye"}'
```

## GET /api/country/:slug
Slug ile getir.

```bash
curl http://localhost:3000/api/country/turkiye
```

## PUT /api/country/:slug
Güncelle.

**Body (JSON)**
- `name` (opsiyonel)

```bash
curl -X PUT http://localhost:3000/api/country/turkiye \
  -H "Content-Type: application/json" \
  -d '{"name":"Turkiye"}'
```

## DELETE /api/country/:slug
Sil.

```bash
curl -X DELETE http://localhost:3000/api/country/turkiye
```

## POST /api/country/:id/icon
Ülke icon upload.

**Form-Data**
- `icon`: dosya

**Response (200)**
- `step`: `"icon-upload"`
- `completed`: `true`
- `country`: güncel kayıt

```bash
curl -X POST http://localhost:3000/api/country/<id>/icon \
  -F "icon=@./tr.png"
```

---

# Kinds (Categories)
Base: `/api/kinds`

## GET /api/kinds
Tüm türler (isme göre sıralı).

```bash
curl http://localhost:3000/api/kinds
```

## POST /api/kinds
Tür oluştur.

**Body (JSON)**
- `name` (string, zorunlu)

```bash
curl -X POST http://localhost:3000/api/kinds \
  -H "Content-Type: application/json" \
  -d '{"name":"Aksiyon"}'
```

## GET /api/kinds/:slug
Slug ile getir.

```bash
curl http://localhost:3000/api/kinds/aksiyon
```

## PUT /api/kinds/:slug
Güncelle.

**Body (JSON)**
- `name` (opsiyonel)

```bash
curl -X PUT http://localhost:3000/api/kinds/aksiyon \
  -H "Content-Type: application/json" \
  -d '{"name":"Macera"}'
```

## DELETE /api/kinds/:slug
Sil.

```bash
curl -X DELETE http://localhost:3000/api/kinds/macera
```

---

# Sound Options
Base: `/api/soundoptions`

## GET /api/soundoptions/film/:filmId
Bir filme ait ses seçenekleri.

**Path Param**
- `filmId` (Mongo ObjectId)

```bash
curl http://localhost:3000/api/soundoptions/film/<filmId>
```

## POST /api/soundoptions
Ses seçeneği oluştur.

**Body (JSON)**
- `filmId` (ObjectId, zorunlu)
- `language` (string, zorunlu)

**Response (201)**
- `step`: `"create"`
- `completed`: `false`
- `soundOption`

```bash
curl -X POST http://localhost:3000/api/soundoptions \
  -H "Content-Type: application/json" \
  -d '{"filmId":"<filmId>","language":"tr"}'
```

## POST /api/soundoptions/:id/upload
Ses dosyası yükle.

**Path Param**
- `id` (SoundOption ObjectId)

**Form-Data**
- `audio`: dosya

**Response (200)**
- `step`: `"sound-upload"`
- `completed`: `true`
- `soundOption`

```bash
curl -X POST http://localhost:3000/api/soundoptions/<id>/upload \
  -F "audio=@./tr.mp3"
```

## DELETE /api/soundoptions/:id
Ses seçeneğini sil.

```bash
curl -X DELETE http://localhost:3000/api/soundoptions/<id>
```

---

# Subtitle Options
Base: `/api/subtitleoptions`

## GET /api/subtitleoptions/film/:filmId
Bir filme ait altyazı seçenekleri.

```bash
curl http://localhost:3000/api/subtitleoptions/film/<filmId>
```

## POST /api/subtitleoptions
Altyazı seçeneği oluştur.

**Body (JSON)**
- `filmId` (ObjectId, zorunlu)
- `language` (string, zorunlu)

**Response (201)**
- `step`: `"create"`
- `completed`: `false`
- `subtitleOption`

```bash
curl -X POST http://localhost:3000/api/subtitleoptions \
  -H "Content-Type: application/json" \
  -d '{"filmId":"<filmId>","language":"tr"}'
```

## POST /api/subtitleoptions/:id/upload
Altyazı dosyası yükle.

**Form-Data**
- `subtitle`: dosya

```bash
curl -X POST http://localhost:3000/api/subtitleoptions/<id>/upload \
  -F "subtitle=@./tr.vtt"
```

## DELETE /api/subtitleoptions/:id
Altyazı seçeneğini sil.

```bash
curl -X DELETE http://localhost:3000/api/subtitleoptions/<id>
```

---

# Content
Base: `/api/content`

## GET /api/content
Tüm içerikleri listeler.

**Response (200)**
- Content array (populate: `categories`, `country`, `ageRating`)

```bash
curl http://localhost:3000/api/content
```

## GET /api/content/:slug
Slug ile içerik getirir.

**Response (200)**
- Content (populate: `categories`, `country`, `ageRating`, `soundOptions`, `subtitleOptions`)

```bash
curl http://localhost:3000/api/content/<slug>
```

## POST /api/content
İçerik oluşturur.

**Body (JSON)**
- `title` (string, zorunlu)
- `contentType` (enum: `movie` | `serie`, zorunlu)
- Opsiyonel alanlar (modelden):
  - `originalTitle`, `categories` (ObjectId[]), `imdbScore`, `country`, `ageRating`, `maxQuality`, `description`, `shortDescription`, `releaseDate` vb.
- Eğer `contentType = "serie"` ise ek olarak:
  - `seriesData` (zorunlu)
    - `description`, `shortDescription`, `releaseDate`

**Response (201)**
- `step`: `"create"`
- `completed`: `false`
- `content`

```bash
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Example Movie",
    "contentType":"movie",
    "imdbScore":7.8
  }'
```

Serie örneği:
```bash
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Example Serie",
    "contentType":"serie",
    "seriesData": {
      "description":"Uzun açıklama",
      "shortDescription":"Kısa açıklama",
      "releaseDate":"2024-01-01"
    }
  }'
```

## PUT /api/content/:id
İçerik günceller.

**Body (JSON)**
- Content modelindeki alanlar

```bash
curl -X PUT http://localhost:3000/api/content/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Yeni Başlık"}'
```

## DELETE /api/content/:id
İçerik siler.

Not: Eğer silinen içerik `serie` ise ilgili `Series` kaydı ve `episodes` içerikleri de transaction ile silinir.

```bash
curl -X DELETE http://localhost:3000/api/content/<id>
```

## POST /api/content/:id/cover
Kapak görseli yükler.

**Form-Data**
- `cover`: dosya

**Response (200)**
- `step`: `"cover-upload"`
- `completed`: `true`
- `content`

```bash
curl -X POST http://localhost:3000/api/content/<id>/cover \
  -F "cover=@./cover.png"
```

## POST /api/content/episode
Dizi bölümü ekler.

**Body (JSON)**
- `serieId` (ObjectId, zorunlu)
- `title` (string, zorunlu)
- `season` (number, zorunlu)
- `episode` (number, zorunlu)
- Ek opsiyonel alanlar (Content modelinden): `description`, `releaseDate`, vb.

**Response (201)**
- `step`: `"episode-create"`
- `episode`: oluşturulan bölüm content’i

```bash
curl -X POST http://localhost:3000/api/content/episode \
  -H "Content-Type: application/json" \
  -d '{
    "serieId":"<serieId>",
    "title":"Pilot",
    "season":1,
    "episode":1
  }'
```

## POST /api/content/:id/publish
İçeriği yayınlar.

Şart: `imagePath` (cover) yüklenmiş olmalı; değilse `400` döner.

**Response (200)**
- `step`: `"publish"`
- `published`: `true`
- `content`

```bash
curl -X POST http://localhost:3000/api/content/<id>/publish
```

## POST /api/content/:id/video
Video yükler.

**Form-Data**
- `video`: dosya

**Response (200)**
- `step`: `"video-upload"`
- `completed`: `true`
- `content`

```bash
curl -X POST http://localhost:3000/api/content/<id>/video \
  -F "video=@./video.mp4"
```

---

# Root

## GET /
Sağlık kontrolü / karşılama.

```bash
curl http://localhost:3000/
```
