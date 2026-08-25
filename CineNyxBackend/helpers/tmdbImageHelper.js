import fetch from "node-fetch";
import s3 from "../config/s3.js";
import Content from "../models/content.js";

export const importTmdbPoster = async (contentId, posterPath) => {
  const content = await Content.findById(contentId);
  if (!content) throw new Error("Content not found");

  if (content.imagePath) return content.imagePath;

  const tmdbUrl = `https://image.tmdb.org/t/p/original${posterPath}`;

  const buffer = await downloadImageAsBuffer(tmdbUrl);

  const imageUrl = await uploadBufferToS3(
    buffer,
    `contents/${contentId}/images/poster.jpg`
  );

  content.imagePath = imageUrl;
  await content.save();

  return imageUrl;
};

const downloadImageAsBuffer = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Resim indirilemedi: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const uploadBufferToS3 = async (buffer, key) => {
  const uploadResult = await s3.upload({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "image/jpeg"
  }).promise();

  return uploadResult.Location;
};