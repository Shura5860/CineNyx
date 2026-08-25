import s3 from "../config/s3.js";

/**
 * S3'te content için klasör yapısı oluşturur
 * contents/{content_id}/images, subtitles, sounds, videos klasörlerini hazırlar
 * 
 * @param {string} contentId - Content'in MongoDB ObjectId'si
 * @returns {Promise<void>}
 */
export const createContentFolderStructure = async (contentId) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const basePath = `contents/${contentId}`;
  
  // S3'te klasör oluşturmak için boş obje (.keep) oluşturuyoruz
  const folders = ['images', 'subtitles', 'sounds', 'videos'];
  
  try {
    // Her klasör için .keep dosyası oluştur
    const promises = folders.map(folder => {
      const key = `${basePath}/${folder}/.keep`;
      
      return s3.putObject({
        Bucket: bucketName,
        Key: key,
        Body: '', // Boş içerik
        ContentType: 'text/plain'
      }).promise();
    });

    await Promise.all(promises);
    console.log(`✅ S3 klasör yapısı oluşturuldu: ${basePath}`);
    
  } catch (error) {
    console.error(`❌ S3 klasör yapısı oluşturulurken hata:`, error);
    throw new Error(`S3 klasör yapısı oluşturulamadı: ${error.message}`);
  }
};

/**
 * Content'in S3 klasör yolunu döndürür
 * 
 * @param {string} contentId - Content'in MongoDB ObjectId'si
 * @param {string} mediaType - 'images', 'subtitles', 'sounds', 'videos'
 * @returns {string} - S3 path'i
 */
export const getContentMediaPath = (contentId, mediaType) => {
  const validTypes = ['images', 'subtitles', 'sounds', 'videos'];
  
  if (!validTypes.includes(mediaType)) {
    throw new Error(`Geçersiz medya tipi: ${mediaType}. Geçerli tipler: ${validTypes.join(', ')}`);
  }
  
  return `contents/${contentId}/${mediaType}`;
};

/**
 * Content'in tüm S3 klasörlerini siler (içerik silindiğinde kullanılır)
 * 
 * @param {string} contentId - Content'in MongoDB ObjectId'si
 * @returns {Promise<void>}
 */
export const deleteContentFolderStructure = async (contentId) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  const prefix = `contents/${contentId}/`;
  
  try {
    // Önce tüm objeleri listele
    const listParams = {
      Bucket: bucketName,
      Prefix: prefix
    };
    
    const listedObjects = await s3.listObjectsV2(listParams).promise();
    
    if (listedObjects.Contents.length === 0) {
      console.log(`📁 Klasör zaten boş: ${prefix}`);
      return;
    }
    
    // Tüm objeleri sil
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map(item => ({ Key: item.Key }))
      }
    };
    
    await s3.deleteObjects(deleteParams).promise();
    
    // Eğer 1000'den fazla obje varsa recursive sil
    if (listedObjects.IsTruncated) {
      await deleteContentFolderStructure(contentId);
    }
    
    console.log(`🗑️ S3 klasör yapısı silindi: ${prefix}`);
    
  } catch (error) {
    console.error(`❌ S3 klasör yapısı silinirken hata:`, error);
    throw new Error(`S3 klasör yapısı silinemedi: ${error.message}`);
  }
};
