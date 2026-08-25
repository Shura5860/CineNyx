import mongoose from "mongoose";
import { Schema } from "mongoose";
import slugify from "slugify";
import { createContentFolderStructure } from "../helpers/s3FolderHelper.js";

export const ContentSchema = new Schema({
  title: { type: String, required: true },
  originalTitle: { type: String },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Kind' }],
  imdbScore: { type: Number, min: 0, max: 10 },
  soundOptions: [{ type: Schema.Types.ObjectId, ref: 'SoundOption' }],
  subtitleOptions: [{ type: Schema.Types.ObjectId, ref: 'SubtitleOption' }],
  country: { type: Schema.Types.ObjectId, ref: 'Country' },
  isAdultContent: { type: Boolean },
  maxQuality: { type: String, enum: ['SD', 'HD', 'FullHD', '4K'] },
  imagePath: { type: String },
  slug: { type: String, unique: true },
  description: { type: String },
  shortDescription: { type: String },
  contentType: { type: String, enum: ['movie', 'serie'], required: true },
  releaseDate: { type: Date },
  likeCount: { type: Number, default: 0 },
  dislikeCount: { type: Number, default: 0 },
  watchCount: { type: Number, default: 0 },
  serieId: { type: Schema.Types.ObjectId, ref: 'Series' },
  season: { type: Number },
  episode: { type: Number },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  videoPath: {
    type: String,
    default: null
  },
  videoPath720: {
    type: String,
    default: null
  },
  videoPath480: {
    type: String,
    default: null
  },
  videoPath360: {
    type: String,
    default: null
  },
  videoDuration: {
    type: Number
  },
  videoSize: {
    type: Number
  },
  completed: {
    type: Boolean,
    default: false
  },
  tmdbId: {
    type: Number,
    default: null
  }
}, { timestamps: true });

ContentSchema.pre("save", function () {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(this.title, { lower: true });
  }
  
  // Yeni kayıt için flag set et (post-save'de kullanmak için)
  if (this.isNew) {
    this._isNewDocument = true;
  }
});

// Content oluşturulduğunda S3'te klasör yapısını oluştur
ContentSchema.post("save", async function (doc) {
  // Sadece yeni oluşturulduğunda çalışsın
  if (this._isNewDocument) {
    try {
      await createContentFolderStructure(doc._id.toString());
    } catch (error) {
      console.error(`⚠️ Content klasör yapısı oluşturulamadı (${doc._id}):`, error.message);
      // Hata olsa bile content kaydını iptal etme, sadece log'la
    } finally {
      // Flag'i temizle
      delete this._isNewDocument;
    }
  }
});

const Content = mongoose.model("Content", ContentSchema);
export default Content;