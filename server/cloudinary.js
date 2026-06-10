const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_api_secret'
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    
    // Cloudinary requires specifying 'resource_type' for non-images
    let resource_type = 'raw';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      resource_type = 'image';
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      resource_type = 'video';
    }

    const cleanName = file.originalname
      .split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, '_');
    
    return {
      folder: 'classportal',
      resource_type: resource_type,
      // Only set format for images, raw files should not have format set in Cloudinary
      format: resource_type === 'image' ? ext : undefined,
      public_id: `${Date.now()}-${cleanName}`
    };
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = {
  cloudinary,
  upload
};
