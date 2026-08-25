import s3 from "../config/s3.js";

const BUCKET = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const PRESIGNED_EXPIRE = 4 * 60 * 60; // 4 saat (saniye)

/**
 * S3 URL'sinden key'i çıkarır.
 * Desteklenen formatlar:
 *   - https://bucket.s3.region.amazonaws.com/key
 *   - https://s3.region.amazonaws.com/bucket/key
 *   - key (zaten sadece key ise olduğu gibi döner)
 */
function extractS3Key(url) {
  if (!url) return null;

  // Zaten key ise (http ile başlamıyorsa)
  if (!url.startsWith("http")) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    // Format: bucket.s3.region.amazonaws.com/key
    if (host.includes(".s3.")) {
      return decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    }

    // Format: s3.region.amazonaws.com/bucket/key
    if (host.startsWith("s3.")) {
      const parts = parsed.pathname.replace(/^\//, "").split("/");
      parts.shift(); // bucket name'i kaldır
      return decodeURIComponent(parts.join("/"));
    }

    // Bilinmeyen format — pathname'i key olarak kullan
    return decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  } catch {
    return url;
  }
}

/**
 * Verilen S3 URL veya key için presigned URL üretir.
 * URL null/undefined ise null döner.
 * 
 * @param {string|null} urlOrKey - S3 URL'si veya key
 * @param {number} [expires] - Geçerlilik süresi (saniye), varsayılan 4 saat
 * @returns {string|null} - Presigned URL veya null
 */
export function getPresignedUrl(urlOrKey, expires = PRESIGNED_EXPIRE) {
  if (!urlOrKey) return null;

  const key = extractS3Key(urlOrKey);
  if (!key) return null;

  try {
    return s3.getSignedUrl("getObject", {
      Bucket: BUCKET,
      Key: key,
      Expires: expires,
    });
  } catch (err) {
    console.error(`❌ Presigned URL üretilemedi (${key}):`, err.message);
    return null;
  }
}

/**
 * Birden fazla URL/key için presigned URL üretir.
 * 
 * @param {Object} urlMap - { label: url } şeklinde obje
 * @returns {Object} - { label: presignedUrl } şeklinde obje
 */
export function getPresignedUrls(urlMap) {
  const result = {};
  for (const [label, url] of Object.entries(urlMap)) {
    result[label] = getPresignedUrl(url);
  }
  return result;
}
