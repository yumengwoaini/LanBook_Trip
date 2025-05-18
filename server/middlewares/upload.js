const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const createUploadDir = (dir) => {
  const uploadPath = path.join(__dirname, '..', 'uploads', dir);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = 'images';
    
    if (file.mimetype.startsWith('video/')) {
      dir = 'videos';
    } else if (file.fieldname === 'avatar') {
      dir = 'avatars';
    }
    
    const uploadPath = createUploadDir(dir);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 过滤文件类型
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (file.fieldname === 'avatar' || file.fieldname === 'images') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持JPEG、PNG、GIF或WebP格式的图片'), false);
    }
  } else if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持MP4、WebM或QuickTime格式的视频'), false);
    }
  } else {
    cb(new Error('不支持的文件字段'), false);
  }
};

// 限制文件大小
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 10 // 最多10个文件
};

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = {
  // 上传单个头像
  uploadAvatar: upload.single('avatar'),
  
  // 上传多张图片
  uploadImages: upload.array('images', 9),
  
  // 上传单个视频
  uploadVideo: upload.single('video'),
  
  // 上传图片和视频
  uploadTravelFiles: upload.fields([
    { name: 'images', maxCount: 9 },
    { name: 'video', maxCount: 1 }
  ]),
  
  // 处理上传错误
  handleUploadError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `上传错误: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  }
}; 