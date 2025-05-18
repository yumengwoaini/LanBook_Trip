const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// 初始化应用
const app = express();
const PORT = process.env.PORT || 5000;

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 新的静态文件配置，专门为头像服务
// 使得 /avatars URL路径 映射到服务器上的 uploads/avatars 文件夹
app.use('/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// 新增：为游记图片提供静态文件服务
// 使得 /images URL路径 映射到服务器上的 uploads/images 文件夹
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));

// 新增：为游记视频提供静态文件服务
// 使得 /videos URL路径 映射到服务器上的 uploads/videos 文件夹
app.use('/videos', express.static(path.join(__dirname, 'uploads/videos')));

// 路由
app.use('/api/users', require('./routes/users'));
app.use('/api/travels', require('./routes/travels'));
app.use('/api/upload', require('./routes/upload'));

// 根路由
app.get('/', (req, res) => {
  res.send('蓝书 API 服务运行中...');
});

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 数据库连接
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tripdb')
  .then(() => {
    console.log('MongoDB 连接成功');
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB 连接失败:', err);
  }); 