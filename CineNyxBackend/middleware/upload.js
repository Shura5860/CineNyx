import multer from "multer";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import s3 from "../config/s3.js";
import { getContentMediaPath } from "../helpers/s3FolderHelper.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "video/mp4",
  "text/vtt",
  "application/x-subrip"
];

const upload = (folder) =>
  multer({
    limits: {
      fileSize: 5 * 1024 * 1024 * 1024 // 🔥 5 GB
    },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Bu dosya tipi olmaz"), false);
      }
      cb(null, true);
    },
    storage: multerS3({
      s3,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = file.originalname.split(".").pop();
        cb(null, `${folder}/${uuidv4()}.${ext}`);
      }
    })
  });

/**
 * Content medya dosyaları için özel upload middleware
 * contents/{content_id}/{media_type}/ klasörüne yükler
 * 
 * @param {string} mediaType - 'images', 'subtitles', 'sounds', 'videos'
 * @returns {Function} - Multer middleware
 */
export const uploadContentMedia = (mediaType) => {
  return multer({
    limits: {
      fileSize: 5 * 1024 * 1024 * 1024 // 🔥 5 GB
    },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Bu dosya tipi olmaz"), false);
      }
      cb(null, true);
    },
    storage: multerS3({
      s3,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const { id } = req.params; // Content ID'yi route parametresinden al
        
        if (!id) {
          return cb(new Error("Content ID bulunamadı"), null);
        }
        
        try {
          const folder = getContentMediaPath(id, mediaType);
          const ext = file.originalname.split(".").pop();
          const filename = `${uuidv4()}.${ext}`;
          
          cb(null, `${folder}/${filename}`);
        } catch (error) {
          cb(error, null);
        }
      }
    })
  });
};

export default upload;
