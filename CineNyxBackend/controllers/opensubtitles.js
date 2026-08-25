import SubtitleOption from "../models/subtitleOption.js";
import Content from "../models/content.js";
import s3 from "../config/s3.js";
import { getContentMediaPath } from "../helpers/s3FolderHelper.js";
import { v4 as uuidv4 } from "uuid";

const OS_API_BASE = "https://api.opensubtitles.com/api/v1";
const OS_API_KEY = process.env.OPENSUBTITLES_API_KEY || "";
const OS_USERNAME = process.env.OPENSUBTITLES_USERNAME || "";
const OS_PASSWORD = process.env.OPENSUBTITLES_PASSWORD || "";

// JWT token cache (sadece download için gerekebilir)
let osToken = null;
let osTokenExpiry = 0;

/**
 * OpenSubtitles API'ye login olup JWT token alır (cache'ler).
 * Opsiyonel – başarısız olursa null döner, akış devam eder.
 */
async function getOsToken() {
  if (!OS_USERNAME || !OS_PASSWORD) return null;

  if (osToken && Date.now() < osTokenExpiry) {
    return osToken;
  }

  try {
    const response = await fetch(`${OS_API_BASE}/login`, {
      method: "POST",
      headers: {
        "Api-Key": OS_API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "iboylaizle v1.0"
      },
      body: JSON.stringify({
        username: OS_USERNAME,
        password: OS_PASSWORD
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`⚠️ OpenSubtitles login başarısız (${response.status}), token'sız devam ediliyor.`, errText);
      return null;
    }

    const data = await response.json();
    osToken = data.token;
    osTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
    console.log("✅ OpenSubtitles login başarılı");
    return osToken;
  } catch (err) {
    console.warn("⚠️ OpenSubtitles login hatası, token'sız devam ediliyor:", err.message);
    return null;
  }
}

/**
 * OpenSubtitles'tan bir tek sayfa altyazı sonucu çeker.
 */
async function fetchOsPage(queryParams) {
  const url = `${OS_API_BASE}/subtitles?${queryParams.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Api-Key": OS_API_KEY,
      "User-Agent": "iboylaizle v1.0"
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenSubtitles API hatası (${response.status}): ${errText}`);
  }

  return response.json();
}

/**
 * DB'deki tmdbId ile OpenSubtitles'tan altyazı arar.
 * Sonuçları dile göre gruplar, her dil için en çok indirilen altyazıyı döner.
 * Body: { filmId, languages? }
 *   - filmId: Content _id (DB'den tmdbId çekilir)
 *   - languages: opsiyonel — virgülle ayrılmış dil kodları (ör. "tr,en,de")
 */
export const searchSubtitles = async (req, res) => {
  try {
    const { filmId, languages } = req.body;
    if (!filmId) {
      return res.status(400).json({ message: "filmId gerekli" });
    }

    // İçeriği DB'den çek, tmdbId al
    const content = await Content.findById(filmId).lean();
    if (!content) {
      return res.status(404).json({ message: "İçerik bulunamadı" });
    }

    // Dizi bölümüyse (season/episode var) ana serinin tmdbId'sini al
    let tmdbId = content.tmdbId;
    const isSerie = content.contentType === "serie";

    if (!tmdbId && isSerie && content.serieId) {
      // Bölüm kaydında tmdbId yok, ana içeriği bul
      const parentContent = await Content.findOne({
        serieId: content.serieId,
        contentType: "serie",
        season: { $exists: false }
      }).lean() || await Content.findOne({
        serieId: content.serieId,
        contentType: "serie",
        tmdbId: { $ne: null }
      }).lean();

      if (parentContent?.tmdbId) {
        tmdbId = parentContent.tmdbId;
      }
    }

    const type = isSerie ? "tv" : "movie";

    const params = new URLSearchParams();

    // tmdbId varsa onunla, yoksa başlıkla ara
    if (tmdbId) {
      params.set("tmdb_id", String(tmdbId));
      params.set("type", type);
    } else {
      // tmdbId yok — başlık ile ara
      const searchTitle = content.originalTitle || content.title;
      params.set("query", searchTitle);
    }

    if (languages) params.set("languages", languages);
    if (isSerie && content.season) params.set("season_number", String(content.season));
    if (isSerie && content.episode) params.set("episode_number", String(content.episode));

    // İlk sayfayı çek
    const firstPage = await fetchOsPage(params);
    let allItems = firstPage.data || [];

    // Birden fazla sayfa varsa diğerlerini de çek (max 5 sayfa)
    const totalPages = firstPage.total_pages || 1;
    const pagesToFetch = Math.min(totalPages, 5);

    for (let page = 2; page <= pagesToFetch; page++) {
      params.set("page", String(page));
      const pageData = await fetchOsPage(params);
      allItems = allItems.concat(pageData.data || []);
    }

    // Dile göre grupla — her dil için en çok indirilen altyazıyı seç
    const langMap = {};
    for (const item of allItems) {
      const lang = item.attributes?.language || "unknown";
      const fileId = item.attributes?.files?.[0]?.file_id || null;
      if (!fileId) continue;

      const entry = {
        id: item.id,
        fileId,
        fileName: item.attributes?.files?.[0]?.file_name || "",
        language: lang,
        release: item.attributes?.release || "",
        downloadCount: item.attributes?.download_count || 0,
        hearingImpaired: item.attributes?.hearing_impaired || false,
        uploaderName: item.attributes?.uploader?.name || "",
      };

      if (!langMap[lang] || entry.downloadCount > langMap[lang].downloadCount) {
        langMap[lang] = entry;
      }
    }

    // Dilleri sırala (indirme sayısına göre)
    const results = Object.values(langMap).sort((a, b) => b.downloadCount - a.downloadCount);

    res.status(200).json({
      tmdbId: tmdbId || null,
      title: content.title,
      total: results.length,
      results
    });
  } catch (error) {
    console.error("OpenSubtitles arama hatası:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * OpenSubtitles'tan seçilen altyazıyı indirir, S3'e yükler
 * ve SubtitleOption kaydını oluşturup Content'e bağlar.
 * Body: { fileId, filmId, language }
 */
export const importSubtitle = async (req, res) => {
  try {
    const { fileId, filmId, language } = req.body;
    if (!fileId || !filmId || !language) {
      return res.status(400).json({ message: "fileId, filmId ve language gerekli" });
    }

    // Download için token almayı dene (opsiyonel)
    const token = await getOsToken();

    const dlHeaders = {
      "Api-Key": OS_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "iboylaizle v1.0"
    };
    if (token) {
      dlHeaders["Authorization"] = `Bearer ${token}`;
    }

    // 1. OpenSubtitles download link al
    const dlResponse = await fetch(`${OS_API_BASE}/download`, {
      method: "POST",
      headers: dlHeaders,
      body: JSON.stringify({ file_id: fileId })
    });

    if (!dlResponse.ok) {
      const errText = await dlResponse.text();
      console.error("OpenSubtitles download hatası:", dlResponse.status, errText);
      return res.status(dlResponse.status).json({ message: "Altyazı indirme hatası", detail: errText });
    }

    const dlData = await dlResponse.json();
    const downloadLink = dlData.link;
    const fileName = dlData.file_name || `subtitle_${uuidv4()}.srt`;

    if (!downloadLink) {
      return res.status(500).json({ message: "İndirme linki alınamadı" });
    }

    // 2. Altyazı dosyasını indir
    const fileResponse = await fetch(downloadLink);
    if (!fileResponse.ok) {
      return res.status(500).json({ message: "Altyazı dosyası indirilemedi" });
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 3. S3'e yükle
    const ext = fileName.split(".").pop() || "srt";
    const s3Key = `${getContentMediaPath(filmId, "subtitles")}/${uuidv4()}.${ext}`;
    const bucketName = process.env.AWS_BUCKET_NAME;

    await s3.putObject({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: ext === "vtt" ? "text/vtt" : "application/x-subrip"
    }).promise();

    const subtitleUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // 4. SubtitleOption oluştur
    const subtitleOption = await SubtitleOption.create({
      filmId,
      language,
      path: subtitleUrl
    });

    // 5. Content'e bağla
    await Content.findByIdAndUpdate(filmId, {
      $addToSet: { subtitleOptions: subtitleOption._id }
    });

    res.status(201).json({
      message: "Altyazı başarıyla içe aktarıldı",
      subtitleOption,
      file: {
        url: subtitleUrl,
        key: s3Key,
        originalName: fileName
      }
    });
  } catch (error) {
    console.error("OpenSubtitles import hatası:", error);
    res.status(500).json({ message: error.message });
  }
};
