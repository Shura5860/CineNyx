/**
 * Mevcut Content kayıtlarında tmdbId olmayanlara TMDB'den arayıp tmdbId atar.
 * Kullanım: node Scripts/syncTmdbIds.js
 */
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import Content from '../models/content.js';

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
if (!TMDB_TOKEN) {
  console.error('❌ TMDB_ACCESS_TOKEN .env dosyasında tanımlı değil');
  process.exit(1);
}

async function searchTmdb(title, type) {
  const mediaType = type === 'serie' ? 'tv' : 'movie';
  const url = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(title)}&language=en-US&page=1`;

  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_TOKEN}`
    }
  });

  if (!res.ok) {
    console.warn(`  ⚠️ TMDB arama hatası (${res.status}) — ${title}`);
    return null;
  }

  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].id;
  }
  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔗 MongoDB bağlandı');

  // tmdbId'si olmayan ana içerikleri bul (bölümler hariç)
  const contents = await Content.find({
    $or: [{ tmdbId: null }, { tmdbId: { $exists: false } }],
    $and: [
      { $or: [{ season: { $exists: false } }, { season: null }] }
    ]
  }).lean();

  console.log(`📋 tmdbId'si olmayan ${contents.length} içerik bulundu\n`);

  let updated = 0;
  let skipped = 0;

  for (const content of contents) {
    const searchTitle = content.originalTitle || content.title;
    const tmdbId = await searchTmdb(searchTitle, content.contentType);

    if (tmdbId) {
      await Content.findByIdAndUpdate(content._id, { tmdbId });
      console.log(`  ✅ "${content.title}" → tmdbId: ${tmdbId}`);
      updated++;
    } else {
      console.log(`  ❌ "${content.title}" — TMDB'de bulunamadı`);
      skipped++;
    }

    // Rate limit: 50 req/sec limit var, güvenli ol
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n🏁 Tamamlandı: ${updated} güncellendi, ${skipped} bulunamadı`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
