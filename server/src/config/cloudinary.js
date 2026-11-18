import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('mock');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.log('Cloudinary not configured or set to mock. Falling back to local disk storage for uploaded resumes.');
}

export const uploadResumeFile = async (tempFilePath) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'auto',
        folder: 'talentflow_resumes',
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, using local filesystem fallback:', error.message);
    }
  }

  // Local filesystem fallback
  const filename = `${Date.now()}_${path.basename(tempFilePath)}`;
  const uploadsDir = path.resolve('public/uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destinationPath = path.join(uploadsDir, filename);
  fs.copyFileSync(tempFilePath, destinationPath);
  
  // Return server asset URL
  return `/uploads/${filename}`;
};
