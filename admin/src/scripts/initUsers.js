const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const initUsers = async () => {
  try {
    // 连接MongoDB
    await mongoose.connect('mongodb://localhost:27017/your_database_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // 要创建的用户列表
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'zhangsan',
        password: 'zhangsan123',
        role: 'reviewer'
      },
      {
        username: 'lisi',
        password: 'lisi123',
        role: 'reviewer'
      },
      {
        username: 'wangwu',
        password: 'wangwu123',
        role: 'reviewer'
      }
    ];

    // 检查用户是否已存在
    for (const user of users) {
      const existingUser = await User.findOne({ username: user.username });
      if (!existingUser) {
        // 对密码进行加密
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // 创建新用户
        await User.create({
          username: user.username,
          password: hashedPassword,
          role: user.role
        });
        console.log(`用户 ${user.username} 创建成功`);
      } else {
        console.log(`用户 ${user.username} 已存在`);
      }
    }

    console.log('用户初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('初始化用户失败:', error);
    process.exit(1);
  }
};

initUsers(); 