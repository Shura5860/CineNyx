import Content from "../models/content.js";
import Series from "../models/series.js";
import SoundOption from "../models/soundOptions.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { deleteContentFolderStructure, getContentMediaPath } from "../helpers/s3FolderHelper.js";
import Kind from "../models/kinds.js";
import Country from "../models/country.js";
import { importTmdbPoster } from "../helpers/tmdbImageHelper.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import s3 from "../config/s3.js";
import { getPresignedUrl } from "../helpers/presignedUrl.js";

export const searchContent = async (req, res) => {
  const { type, name } = req.body;

  try {
    const encodedName = encodeURIComponent(name);

    const url = `https://api.themoviedb.org/3/search/${type}?query=${encodedName}&include_adult=true&language=en-US&page=1`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();

    const results = data.results.map(item => ({
      id: item.id,
      title: item.title ?? item.name,
      poster: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null
    }));

    res.status(200).json(results);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  };
}

export const createContentAuto = async (req, res) => {
  const { tmdbId, type } = req.body;

  try {
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?language=en-US`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();

    const categoryDocs = await Kind.find({
      tmdbId: { $in: data.genres.map(g => g.id) }
    });
    const categoryIds = categoryDocs.map(c => c._id);

    const countryDoc = await Country.findOne({
      code: data.production_countries?.[0]?.iso_3166_1
    });

    let serie = null;

    const title = data.title ?? data.name ?? '';
    const originalTitle = data.original_title ?? data.original_name ?? '';
    const releaseDate = type === 'tv' ? (data.first_air_date ?? data.release_date) : data.release_date;

    const titleStr = typeof title === 'string' ? title : '';
    const slug = slugify(titleStr, { lower: true });

    if (type === "tv") {
      serie = await Series.create({
        title: titleStr,
        description: data.overview,
        shortDescription: data.tagline,
        slug,
        releaseDate
      });
    }

    const contentPayload = {
      title: titleStr,
      originalTitle,
      imdbScore: data.vote_average,
      description: data.overview,
      shortDescription: data.tagline,
      contentType: type === "movie" ? "movie" : "serie",
      ...(type === "tv" && serie ? { serieId: serie._id } : {}),
      releaseDate,
      categories: categoryIds,
      country: countryDoc?._id,
      isAdultContent: data.adult,
      slug,
      status: "draft",
      tmdbId: Number(tmdbId)
    };

    const content = await Content.create(contentPayload);

    if (data.poster_path) {
      await importTmdbPoster(content._id, data.poster_path);

      if (data.poster_path) {
        const posterUrl = await importTmdbPoster(content._id, data.poster_path);

        if (type === "tv" && serie) {
          serie.coverImage = posterUrl;
          await serie.save();
        }
      }
    }

    res.status(200).json({
      completed: true,
      content
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const createContent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("BODY:", req.body);

  try {
    const {
      title,
      contentType,
      seriesData,
      ...rest
    } = req.body;

    const content = await Content.create([{
      title,
      contentType,
      slug: slugify(title, { lower: true }),
      ...rest
    }], { session });

    if (contentType === "serie") {
      if (!seriesData) {
        throw new Error("Series bilgileri zorunlu kanka");
      }

      const serie = await Series.create([{
        title,
        description: seriesData.description,
        shortDescription: seriesData.shortDescription,
        releaseDate: seriesData.releaseDate
      }], { session });

      content[0].serieId = serie[0]._id;
      await content[0].save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      step: "create",
      completed: false,
      content: content[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: error.message });
  }
};

export const addEpisode = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      serieId,
      title,
      season,
      episode,
      ...rest
    } = req.body;

    const serie = await Series.findById(serieId);
    if (!serie) {
      throw new Error("Serie bulunamadı");
    }

    const episodeContent = await Content.create([{
      title,
      contentType: "serie",
      season,
      episode,
      serieId,
      slug: slugify(`${title}-s${season}e${episode}`, { lower: true }),
      ...rest
    }], { session });

    serie.episodes.push(episodeContent[0]._id);
    serie.seasonCount = Math.max(serie.seasonCount, season);
    await serie.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      step: "episode-create",
      episode: episodeContent[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: error.message });
  }
};

export const uploadCoverImage = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    content.imagePath = req.file.location;
    await content.save();

    res.status(200).json({
      step: "cover-upload",
      completed: true,
      content
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getContents = async (req, res) => {
  try {
    // Query parametresi ile status filtresi (opsiyonel)
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const contents = await Content.find(query)
      .populate("categories country")
      .sort({ createdAt: -1 });

    // imagePath'leri presigned URL'ye çevir
    const signedContents = contents.map(c => {
      const obj = c.toObject();
      obj.imagePath = getPresignedUrl(obj.imagePath);
      return obj;
    });

    res.status(200).json(signedContents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getContentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const content = await Content.findOne({ slug })
      .populate("categories country ageRating soundOptions subtitleOptions");

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const obj = content.toObject();
    obj.imagePath = getPresignedUrl(obj.imagePath);
    obj.videoPath = getPresignedUrl(obj.videoPath);
    obj.videoPath720 = getPresignedUrl(obj.videoPath720);
    obj.videoPath480 = getPresignedUrl(obj.videoPath480);
    obj.videoPath360 = getPresignedUrl(obj.videoPath360);
    if (obj.soundOptions) {
      obj.soundOptions = obj.soundOptions.map(s => ({ ...s, path: getPresignedUrl(s.path) }));
    }
    if (obj.subtitleOptions) {
      obj.subtitleOptions = obj.subtitleOptions.map(s => ({ ...s, path: getPresignedUrl(s.path) }));
    }

    res.status(200).json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id)
      .populate("categories country soundOptions subtitleOptions");

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // Ses ve altyazı seçeneklerindeki path'leri presigned URL'ye çevir
    const signedSoundOptions = (content.soundOptions || []).map(s => ({
      ...s.toObject ? s.toObject() : s,
      path: s.path ? getPresignedUrl(s.path) : null
    }));
    const signedSubtitleOptions = (content.subtitleOptions || []).map(s => ({
      ...s.toObject ? s.toObject() : s,
      path: s.path ? getPresignedUrl(s.path) : null
    }));

    res.status(200).json({
      _id: content._id,
      id: content._id,
      title: content.title,
      originalTitle: content.originalTitle,
      description: content.description,
      shortDescription: content.shortDescription,
      contentType: content.contentType,
      serieId: content.serieId,
      season: content.season,
      episode: content.episode,
      status: content.status,
      videoPath: getPresignedUrl(content.videoPath),
      video_url_1080: getPresignedUrl(content.videoPath),
      video_url_720: getPresignedUrl(content.videoPath720),
      video_url_480: getPresignedUrl(content.videoPath480),
      video_url_360: getPresignedUrl(content.videoPath360),
      hls_url: "",
      imagePath: getPresignedUrl(content.imagePath),
      poster_url: getPresignedUrl(content.imagePath),
      slug: content.slug,
      categories: content.categories,
      imdbScore: content.imdbScore,
      soundOptions: signedSoundOptions,
      subtitleOptions: signedSubtitleOptions,
      country: content.country,
      maxQuality: content.maxQuality,
      releaseDate: content.releaseDate,
      likeCount: content.likeCount,
      dislikeCount: content.dislikeCount,
      watchCount: content.watchCount,
      videoDuration: content.videoDuration,
      videoSize: content.videoSize,
      completed: content.completed,
      tmdbId: content.tmdbId || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEpisodesBySerieId = async (req, res) => {
  try {
    const { serieId } = req.params;
    
    const episodes = await Content.find({ 
      serieId: serieId,
      contentType: 'serie',
      season: { $exists: true },
      episode: { $exists: true }
    })
      .populate("categories country")
      .sort({ season: 1, episode: 1 });

    const signedEpisodes = episodes.map(ep => {
      const obj = ep.toObject();
      obj.imagePath = getPresignedUrl(obj.imagePath);
      obj.videoPath = getPresignedUrl(obj.videoPath);
      return obj;
    });

    res.status(200).json(signedEpisodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.title) {
      updateData.slug = slugify(updateData.title, { lower: true });
    }

    const content = await Content.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteContent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const content = await Content.findById(id).session(session);
    if (!content) {
      throw new Error("Content not found");
    }

    // Eğer serie ise → series + episodes sil
    if (content.contentType === "serie" && content.serieId) {
      const serie = await Series.findById(content.serieId).session(session);

      if (serie) {
        // Her episode için S3 klasörlerini sil
        for (const episodeId of serie.episodes) {
          try {
            await deleteContentFolderStructure(episodeId.toString());
          } catch (error) {
            console.error(`⚠️ Episode klasörü silinemedi (${episodeId}):`, error.message);
          }
        }

        await Content.deleteMany(
          { _id: { $in: serie.episodes } },
          { session }
        );

        await Series.findByIdAndDelete(serie._id, { session });
      }
    }

    // Content'in S3 klasörlerini sil
    try {
      await deleteContentFolderStructure(id);
    } catch (error) {
      console.error(`⚠️ Content klasörü silinemedi (${id}):`, error.message);
      // Hata olsa bile devam et, sadece log'la
    }

    await Content.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Content deleted" });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: error.message });
  }
};

export const publishContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // basit validation
    if (!content.imagePath) {
      return res.status(400).json({ message: "Cover yüklenmemiş" });
    }

    content.status = "published";
    await content.save();

    res.status(200).json({
      step: "publish",
      published: true,
      content
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadContentVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const extractAudio = req.body?.extractAudio === 'true' || req.query?.extractAudio === 'true';
    const audioLanguage = req.body?.audioLanguage || req.query?.audioLanguage || 'tr';

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    // Orijinal video (1080p / en yüksek kalite) olarak kaydet
    content.videoPath = req.file.location;
    content.videoSize = req.file.size;

    await content.save();

    let extractedSound = null;

    // Eğer ses çıkarma işlemi istendiyse
    if (extractAudio && audioLanguage) {
      try {
        extractedSound = await extractAudioFromS3Video(req.file.key, id, audioLanguage);

        // SoundOption oluştur ve content'e bağla
        const soundOption = await SoundOption.create({
          filmId: id,
          language: audioLanguage,
          path: extractedSound.url
        });

        // Content'in soundOptions array'ine ekle
        content.soundOptions.push(soundOption._id);
        await content.save();

        extractedSound.soundOptionId = soundOption._id;
      } catch (audioError) {
        console.error('Ses çıkarma hatası:', audioError.message);
        extractedSound = { error: audioError.message };
      }
    }

    // Arka planda farklı kalitelere transcode et (yanıtı bekletme)
    transcodeToMultipleQualities(req.file.key, id).catch(err => {
      console.error(`❌ Transcode hatası (content ${id}):`, err.message);
    });

    res.status(200).json({
      step: "video-upload",
      completed: true,
      content,
      file: {
        url: req.file.location,
        key: req.file.key,
        size: req.file.size
      },
      extractedAudio: extractedSound,
      transcoding: true,
      message: "Video yüklendi, diğer kaliteler arka planda oluşturuluyor..."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Orijinal videoyu 720p, 480p, 360p kalitelerine dönüştürür ve S3'e yükler
 */
async function transcodeToMultipleQualities(videoS3Key, contentId) {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const tmpDir = os.tmpdir();
  const tmpVideoPath = path.join(tmpDir, `src_${uuidv4()}.mp4`);

  const qualities = [
    { label: '720', height: 720, bitrate: '2500k', field: 'videoPath720' },
    { label: '480', height: 480, bitrate: '1200k', field: 'videoPath480' },
    { label: '360', height: 360, bitrate: '800k',  field: 'videoPath360' }
  ];

  try {
    // 1. S3'ten orijinal videoyu indir
    console.log(`⬇️ Transcode: Orijinal video indiriliyor... (${videoS3Key})`);
    const videoStream = s3.getObject({ Bucket: bucketName, Key: videoS3Key }).createReadStream();
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(tmpVideoPath);
      videoStream.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
      videoStream.on('error', reject);
    });

    // 2. Her kalite için transcode et
    for (const q of qualities) {
      const tmpOutputPath = path.join(tmpDir, `out_${uuidv4()}_${q.label}p.mp4`);
      try {
        console.log(`🔄 Transcode: ${q.label}p oluşturuluyor...`);

        await new Promise((resolve, reject) => {
          ffmpeg(tmpVideoPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size(`?x${q.height}`)
            .videoBitrate(q.bitrate)
            .outputOptions([
              '-preset fast',
              '-movflags +faststart',
              '-crf 23'
            ])
            .output(tmpOutputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // 3. S3'e yükle
        const s3Key = `${getContentMediaPath(contentId, 'videos')}/${uuidv4()}_${q.label}p.mp4`;
        const fileBuffer = fs.readFileSync(tmpOutputPath);

        await s3.putObject({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: 'video/mp4'
        }).promise();

        const videoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // 4. Content'i güncelle
        await Content.findByIdAndUpdate(contentId, { [q.field]: videoUrl });
        console.log(`✅ Transcode: ${q.label}p tamamlandı → ${videoUrl}`);

      } catch (qErr) {
        console.error(`❌ Transcode: ${q.label}p başarısız:`, qErr.message);
      } finally {
        try { if (fs.existsSync(tmpOutputPath)) fs.unlinkSync(tmpOutputPath); } catch (e) { /* ignore */ }
      }
    }

    console.log(`✅ Transcode tamamlandı (content ${contentId})`);
  } finally {
    try { if (fs.existsSync(tmpVideoPath)) fs.unlinkSync(tmpVideoPath); } catch (e) { /* ignore */ }
  }
}

/**
 * S3'teki videodan ses çıkarır ve tekrar S3'e yükler
 */
async function extractAudioFromS3Video(videoS3Key, contentId, language) {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const tmpDir = os.tmpdir();
  const tmpVideoPath = path.join(tmpDir, `video_${uuidv4()}.mp4`);
  const tmpAudioPath = path.join(tmpDir, `audio_${uuidv4()}.mp3`);

  try {
    // 1. S3'ten videoyu geçici dosyaya indir
    const videoStream = s3.getObject({
      Bucket: bucketName,
      Key: videoS3Key
    }).createReadStream();

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(tmpVideoPath);
      videoStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      videoStream.on('error', reject);
    });

    // 2. ffmpeg ile sesi çıkar
    await new Promise((resolve, reject) => {
      ffmpeg(tmpVideoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .output(tmpAudioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // 3. Çıkarılan sesi S3'e yükle
    const audioKey = `${getContentMediaPath(contentId, 'sounds')}/${uuidv4()}.mp3`;
    const audioFileBuffer = fs.readFileSync(tmpAudioPath);
    const audioFileSize = fs.statSync(tmpAudioPath).size;

    await s3.putObject({
      Bucket: bucketName,
      Key: audioKey,
      Body: audioFileBuffer,
      ContentType: 'audio/mpeg'
    }).promise();

    const audioUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;

    return {
      url: audioUrl,
      key: audioKey,
      size: audioFileSize,
      language
    };
  } finally {
    // Geçici dosyaları temizle
    try { if (fs.existsSync(tmpVideoPath)) fs.unlinkSync(tmpVideoPath); } catch (e) { /* ignore */ }
    try { if (fs.existsSync(tmpAudioPath)) fs.unlinkSync(tmpAudioPath); } catch (e) { /* ignore */ }
  }
}

export const uploadContentSubtitle = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json({
      step: "subtitle-upload",
      completed: true,
      content,
      file: {
        url: req.file.location,
        key: req.file.key,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadContentAudio = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json({
      step: "audio-upload",
      completed: true,
      content,
      file: {
        url: req.file.location,
        key: req.file.key,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};