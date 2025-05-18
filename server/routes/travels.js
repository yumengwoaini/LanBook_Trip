const express = require('express');
const router = express.Router();
const {
  createTravel,
  getTravels,
  getTravel,
  updateTravel,
  deleteTravel,
  getMyTravels,
  getAdminTravels,
  reviewTravel
} = require('../controllers/travels');
const { protect, authorize } = require('../middlewares/auth');
const { uploadTravelFiles, handleUploadError } = require('../middlewares/upload');

// 公开路由
router.get('/', getTravels);

// 需要管理员或审核员权限的路由
router.get('/admin/all', protect, authorize('admin', 'reviewer'), getAdminTravels);
router.put('/:id/review', protect, authorize('admin', 'reviewer'), reviewTravel);

// 需要登录的路由
router.use(protect);

// 获取当前用户的游记
router.get('/my', getMyTravels);

// 创建游记
router.post('/', uploadTravelFiles, handleUploadError, createTravel);

// 获取单个游记详情
router.get('/:id', getTravel);

// 更新游记
router.put('/:id', uploadTravelFiles, handleUploadError, updateTravel);

// 删除游记
router.delete('/:id', deleteTravel);

// 错误处理中间件
router.use((err, req, res, next) => {
  console.error('游记路由错误:', err);
  res.status(500).json({
    success: false,
    message: '获取游记列表失败，请稍后重试',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router; 