const express = require('express');
const router = express.Router();
const { register, login, getMe, updateAvatar, updateNickname } = require('../controllers/users');
const { protect } = require('../middlewares/auth');
const { uploadAvatar, handleUploadError } = require('../middlewares/upload');

// 用户注册（支持上传头像）
router.post('/register', uploadAvatar, handleUploadError, register);

// 用户登录
router.post('/login', login);

// 以下路由需要登录
router.use(protect);

// 获取当前用户信息
router.get('/me', getMe);

// 更新用户头像
router.put('/avatar', uploadAvatar, handleUploadError, updateAvatar);

// 更新用户昵称
router.put('/nickname', updateNickname);

module.exports = router; 