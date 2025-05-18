const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 导入模型
const User = require('./models/User');
const Travel = require('./models/Travel');

// 连接数据库
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tripdb')
  .then(() => console.log('MongoDB 连接成功'))
  .catch((err) => console.error('MongoDB 连接失败:', err));

// 测试用户数据
const users = [
  {
    username: 'admin',
    password: 'admin123',
    nickname: '管理员',
    avatar: 'default-avatar.png',
    role: 'admin'
  },
  {
    username: 'reviewer',
    password: 'reviewer123',
    nickname: '审核员',
    avatar: 'default-avatar.png',
    role: 'reviewer'
  },
  {
    username: 'user1',
    password: 'user123',
    nickname: '旅行家小明',
    avatar: 'default-avatar.png',
    role: 'user'
  },
  {
    username: 'user2',
    password: 'user123',
    nickname: '探险者小红',
    avatar: 'default-avatar.png',
    role: 'user'
  }
];

// 测试游记数据
const travels = [
  {
    title: '北京三日游',
    content: '在北京的三天，我参观了故宫、长城和天坛。故宫的建筑宏伟壮观，长城的雄伟让人震撼，天坛的祥和让人心旷神怡。',
    images: ['images/default-image-1.jpg', 'images/default-image-2.jpg'],
    status: 'approved'
  },
  {
    title: '上海一周游记',
    content: '上海是一座充满活力的城市，外滩的夜景美不胜收，豫园的传统建筑精美绝伦，东方明珠塔俯瞰全城的感觉令人难忘。',
    images: ['images/default-image-3.jpg'],
    status: 'approved'
  },
  {
    title: '杭州西湖游玩体验',
    content: '西湖真的名不虚传，湖光山色、亭台楼阁，处处是景。特别推荐断桥残雪和雷峰塔，非常有韵味。',
    images: ['images/default-image-4.jpg', 'images/default-image-5.jpg'],
    status: 'pending'
  },
  {
    title: '成都美食之旅',
    content: '成都的美食真是让人流连忘返，火锅、串串、担担面、回锅肉，每一样都让人回味无穷。宽窄巷子的氛围也很好。',
    images: ['images/default-image-6.jpg'],
    status: 'pending'
  },
  {
    title: '厦门海岛度假',
    content: '厦门的海滩非常干净，海水清澈。鼓浪屿的建筑别具一格，漫步在岛上的小路，听着海浪声，十分惬意。',
    images: ['images/default-image-7.jpg', 'images/default-image-8.jpg'],
    status: 'rejected',
    rejectReason: '图片质量不够清晰，请重新上传高清图片'
  }
];

// 导入测试数据
const importData = async () => {
  try {
    // 清空现有数据
    await User.deleteMany();
    await Travel.deleteMany();

    console.log('数据已清空');

    // 创建用户
    const createdUsers = [];
    for (const user of users) {
      // 手动加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const createdUser = await User.create({
        ...user,
        password: hashedPassword
      });
      createdUsers.push(createdUser);
    }

    console.log('用户数据已导入');

    // 创建游记
    const travelPromises = travels.map((travel, index) => {
      // 为不同游记分配不同作者
      const authorIndex = (index % (createdUsers.length - 2)) + 2; // 分配给普通用户
      return Travel.create({
        ...travel,
        author: createdUsers[authorIndex]._id,
        reviewedBy: travel.status !== 'pending' ? createdUsers[0]._id : null,
        reviewedAt: travel.status !== 'pending' ? new Date() : null
      });
    });

    await Promise.all(travelPromises);
    console.log('游记数据已导入');

    console.log('所有测试数据已成功导入');
    process.exit();
  } catch (error) {
    console.error('数据导入错误:', error);
    process.exit(1);
  }
};

// 删除所有数据
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Travel.deleteMany();

    console.log('所有数据已成功删除');
    process.exit();
  } catch (error) {
    console.error('数据删除错误:', error);
    process.exit(1);
  }
};

// 根据命令行参数执行相应操作
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
} 