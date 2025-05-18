require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const createAdmin = async () => {
  try {
    // 使用 config.js 中的配置
    const mongoUri = config.MONGO_URI;
    console.log('正在连接到 MongoDB:', mongoUri);
    
    // 连接数据库
    await mongoose.connect(mongoUri);
    console.log('MongoDB 连接成功');

    // 检查是否已存在管理员用户
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('管理员用户已存在');
      process.exit(0);
    }

    // 创建管理员用户
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123', // 密码会自动加密
      nickname: '系统管理员',
      role: 'admin'
    });

    console.log('管理员用户创建成功:', adminUser);
    process.exit(0);
  } catch (error) {
    console.error('创建管理员用户失败:', error);
    process.exit(1);
  }
};

createAdmin(); 