import SoundOptions from "../models/soundOptions.js";
import Content from "../models/content.js";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import s3 from "../config/s3.js";
import { getContentMediaPath } from "../helpers/s3FolderHelper.js";
import { getPresignedUrl } from "../helpers/presignedUrl.js";

export const getSoundOptionsByFilm = async (req, res) => {
  try {
    const { filmId } = req.params;

    const sounds = await SoundOptions.find({ filmId });
    const signedSounds = sounds.map(s => {
      const obj = s.toObject();
      obj.path = getPresignedUrl(obj.path);
      return obj;
    });
    res.status(200).json(signedSounds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSoundOption = async (req, res) => {
  try {
    const { filmId, language } = req.body;

    const soundOption = await SoundOptions.create({
      filmId,
      language
    });

    // Content'in soundOptions dizisine ekle
    await Content.findByIdAndUpdate(filmId, {
      $addToSet: { soundOptions: soundOption._id }
    });

    res.status(201).json({
      step: "create",
      completed: false,
      soundOption
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadSoundFile = async (req, res) => {
  try {
    const { id } = req.params;

    const soundOption = await SoundOptions.findById(id);
    if (!soundOption) {
      return res.status(404).json({ message: "Sound option not found" });
    }

    soundOption.path = req.file.location;
    await soundOption.save();

    res.status(200).json({
      step: "sound-upload",
      completed: true,
      soundOption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSoundOption = async (req, res) => {
  try {
    const { id } = req.params;

    const soundOption = await SoundOptions.findByIdAndDelete(id);
    if (!soundOption) {
      return res.status(404).json({ message: "Sound option not found" });
    }

    // Content'in soundOptions dizisinden referansı kaldır
    await Content.findByIdAndUpdate(soundOption.filmId, {
      $pull: { soundOptions: soundOption._id }
    });

    res.status(200).json({ message: "Sound option deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Video dosyasından ses çıkarıp SoundOption'a yükler.
 * Video geçici olarak sunucuya alınır, ffmpeg ile ses çıkarılır,
 * ses S3'e yüklenir, geçici dosyalar silinir.
 */
export const uploadSoundFromVideo = async (req, res) => {
  const tmpVideoPath = path.join(os.tmpdir(), `vid_${uuidv4()}.mp4`);
  const tmpAudioPath = path.join(os.tmpdir(), `aud_${uuidv4()}.mp3`);

  try {
    const { id } = req.params;

    const soundOption = await SoundOptions.findById(id);
    if (!soundOption) {
      return res.status(404).json({ message: "Sound option not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video dosyası gönderilmedi" });
    }

    // 1. S3'teki videoyu geçici dosyaya indir
    const bucketName = process.env.AWS_BUCKET_NAME;
    const videoStream = s3.getObject({
      Bucket: bucketName,
      Key: req.file.key
    }).createReadStream();

    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(tmpVideoPath);
      videoStream.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
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

    // 3. Ses dosyasını S3'e yükle
    const audioKey = `${getContentMediaPath(soundOption.filmId.toString(), 'sounds')}/${uuidv4()}.mp3`;
    const audioBuffer = fs.readFileSync(tmpAudioPath);

    await s3.putObject({
      Bucket: bucketName,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: 'audio/mpeg'
    }).promise();

    const audioUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;

    // 4. S3'teki geçici video dosyasını sil
    try {
      await s3.deleteObject({
        Bucket: bucketName,
        Key: req.file.key
      }).promise();
    } catch (e) {
      console.error('Geçici video silinemedi:', e.message);
    }

    // 5. SoundOption'u güncelle
    soundOption.path = audioUrl;
    await soundOption.save();

    res.status(200).json({
      step: "sound-from-video",
      completed: true,
      soundOption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    try { if (fs.existsSync(tmpVideoPath)) fs.unlinkSync(tmpVideoPath); } catch (e) { /* ignore */ }
    try { if (fs.existsSync(tmpAudioPath)) fs.unlinkSync(tmpAudioPath); } catch (e) { /* ignore */ }
  }
};
