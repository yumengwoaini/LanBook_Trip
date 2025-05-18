// 模拟用户数据
export const mockUsers = [
  {
    id: '1',
    username: 'test',
    password: 'test123',
    nickname: '测试用户',
    avatar: 'uploads/default-avatar.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// 生成更多模拟游记数据的函数
const generateMockTravels = (count, startId = 7) => {
  const travels = [];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安', '南京', '厦门', '三亚', '丽江', '大理', '桂林', '青岛', '苏州', '武汉', '长沙', '昆明', '贵阳'];
  const activities = ['美食之旅', '文化探索', '自然风光', '历史古迹', '购物天堂', '休闲度假', '户外冒险'];
  const contents = [
    '这次旅行真是太棒了，风景优美，人文底蕴深厚，当地美食也让人回味无穷...',
    '作为一个旅行爱好者，这个地方绝对是我的必去之地。不仅风景如画，而且当地人也非常热情...',
    '这里的景色真是令人叹为观止，蓝天白云下的壮丽景观让人流连忘返...',
    '此行收获满满，不仅欣赏了美丽的自然风光，还深入了解了当地的风土人情和历史文化...',
    '这里的美食真是让人难以抗拒，各种地方特色小吃让我大饱口福，一定要再来一次...',
    '清晨的阳光，傍晚的晚霞，夜晚的星空，每一刻都让人沉醉其中...',
    '这里有着深厚的历史底蕴，古老的建筑和现代的城市相互交融，形成独特的魅力...'
  ];
  
  for (let i = 0; i < count; i++) {
    const id = (startId + i).toString();
    const cityIndex = Math.floor(Math.random() * cities.length);
    const activityIndex = Math.floor(Math.random() * activities.length);
    const contentIndex = Math.floor(Math.random() * contents.length);
    const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30天前
    const date = new Date(Date.now() - 3600000 * 24 * daysAgo);
    
    travels.push({
      id,
      title: `${cities[cityIndex]}${activities[activityIndex]}`,
      content: `${cities[cityIndex]}${contents[contentIndex]}`,
      images: Array(Math.floor(Math.random() * 3) + 1).fill('uploads/default-travel.jpg'),
      video: Math.random() > 0.8 ? 'uploads/default-travel.jpg' : null, // 20%的概率有视频
      author: {
        id: '1',
        nickname: '测试用户',
        avatar: 'uploads/default-avatar.png'
      },
      status: Math.random() > 0.2 ? 'approved' : (Math.random() > 0.5 ? 'pending' : 'rejected'),
      rejectReason: Math.random() > 0.5 ? '' : '内容不完整或不符合规范',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  }
  
  return travels;
};

// 模拟游记数据
export const mockTravels = [
  {
    id: '1',
    title: '北京三日游',
    content: '北京是中国的首都，有着悠久的历史和丰富的文化遗产。这次旅行我参观了故宫、长城、天坛等著名景点，体验了正宗的北京烤鸭...',
    images: ['uploads/default-travel.jpg', 'uploads/default-travel.jpg', 'uploads/default-travel.jpg'],
    video: null,
    author: {
      id: '1',
      nickname: '测试用户',
      avatar: 'uploads/default-avatar.png'
    },
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2天前
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: '2',
    title: '上海外滩夜景',
    content: '上海的夜景非常漂亮，尤其是外滩的夜景。站在浦西，看浦东的摩天大楼，灯光闪烁，倒映在黄浦江上，真是美不胜收...',
    images: ['uploads/default-travel.jpg', 'uploads/default-travel.jpg'],
    video: null,
    author: {
      id: '1',
      nickname: '测试用户',
      avatar: 'uploads/default-avatar.png'
    },
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5天前
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: '3',
    title: '杭州西湖游记',
    content: '西湖十景果然名不虚传，断桥残雪、平湖秋月、雷峰夕照，每一个景点都美不胜收。我们还品尝了当地的龙井茶和杭帮菜...',
    images: ['uploads/default-travel.jpg'],
    video: null,
    author: {
      id: '2',
      nickname: '旅行爱好者',
      avatar: null
    },
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10天前
    updatedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
  {
    id: '4',
    title: '成都美食之旅',
    content: '成都真是一个美食天堂，火锅、串串、兔头、钵钵鸡，每一样都让人回味无穷。除了美食，我们还去了宽窄巷子、锦里古街，感受了慢生活的魅力...',
    images: ['uploads/default-travel.jpg', 'uploads/default-travel.jpg', 'uploads/default-travel.jpg'],
    video: null,
    author: {
      id: '3',
      nickname: '美食家',
      avatar: null
    },
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(), // 15天前
    updatedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
  // 添加更多生成的游记数据
  ...generateMockTravels(30, 5),
];

// 模拟我的游记数据
export const mockMyTravels = [
  ...mockTravels.slice(0, 2), // 已通过
  {
    id: '35',
    title: '厦门环岛游',
    content: '厦门是一个美丽的海滨城市，我们环岛骑行，参观了鼓浪屿、南普陀寺、厦门大学等景点，还品尝了各种海鲜...',
    images: ['uploads/default-travel.jpg', 'uploads/default-travel.jpg'],
    video: null,
    author: {
      id: '1',
      nickname: '测试用户',
      avatar: 'uploads/default-avatar.png'
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), // 1小时前
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: '36',
    title: '丽江古城',
    content: '丽江古城的美景和风土人情让人难忘，古城内的小巷、溪流、特色小店，还有拉市海、玉龙雪山，每一处都让人流连忘返...',
    images: ['uploads/default-travel.jpg'],
    video: null,
    author: {
      id: '1',
      nickname: '测试用户',
      avatar: 'uploads/default-avatar.png'
    },
    status: 'rejected',
    rejectReason: '内容不完整，图片质量不佳',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 7天前
    updatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  // 添加更多我的游记
  ...generateMockTravels(25, 37)
]; 