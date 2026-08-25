/**
 * Tek seferlik script: SoundOption ve SubtitleOption kayıtlarının
 * Content.soundOptions / Content.subtitleOptions dizilerine
 * referanslarını ekler (eksik olanları düzeltir).
 *
 * Kullanım: node Scripts/syncSoundSubtitleRefs.js
 */
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import Content from '../models/content.js';
import SoundOption from '../models/soundOptions.js';
import SubtitleOption from '../models/subtitleOption.js';

async function sync() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB bağlantısı kuruldu.');

  // --- SoundOptions ---
  const sounds = await SoundOption.find({});
  console.log(`Toplam ${sounds.length} ses seçeneği bulundu.`);
  for (const s of sounds) {
    const result = await Content.updateOne(
      { _id: s.filmId, soundOptions: { $ne: s._id } },
      { $addToSet: { soundOptions: s._id } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  + SoundOption "${s.language}" (${s._id}) → Content ${s.filmId} eklendi.`);
    }
  }

  // --- SubtitleOptions ---
  const subs = await SubtitleOption.find({});
  console.log(`Toplam ${subs.length} altyazı seçeneği bulundu.`);
  for (const s of subs) {
    const result = await Content.updateOne(
      { _id: s.filmId, subtitleOptions: { $ne: s._id } },
      { $addToSet: { subtitleOptions: s._id } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  + SubtitleOption "${s.language}" (${s._id}) → Content ${s.filmId} eklendi.`);
    }
  }

  console.log('Senkronizasyon tamamlandı.');
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
