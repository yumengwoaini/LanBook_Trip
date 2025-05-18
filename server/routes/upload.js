const express = require('express');
const router = express.Router();
const { uploadImages, uploadVideo, uploadAvatar } = require('../controllers/upload');
const { protect } = require('../middlewares/auth');
const { uploadImages: uploadImagesMiddleware, uploadVideo: uploadVideoMiddleware, uploadAvatar: uploadAvatarMiddleware, handleUploadError } = require('../middlewares/upload');

// 所有上传路由都需要登录
router.use(protect);

// 上传图片
router.post('/images', uploadImagesMiddleware, handleUploadError, uploadImages);

// 上传视频
router.post('/video', uploadVideoMiddleware, handleUploadError, uploadVideo);

// 上传头像
router.post('/avatar', uploadAvatarMiddleware, handleUploadError, uploadAvatar);

module.exports = router; 