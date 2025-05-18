// API基础URL - 安卓模拟器专用
export const API_URL = 'http://10.0.2.2:5000/api'; // 安卓模拟器中使用
// export const API_URL = 'http://localhost:5000/api'; // 本地开发环境
// export const API_URL = 'https://your-api-server.com/api'; // 生产环境

// 服务器基础URL（不包含/api）
export const SERVER_URL = API_URL.substring(0, API_URL.indexOf('/api'));

// 获取完整资源URL的辅助函数
export const getFullResourceUrl = (path, addTimestamp = true) => {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回原始URL或添加时间戳
  if (path.startsWith('http')) {
    // 检查URL是否已经包含查询参数
    const hasQueryParams = path.includes('?');
    return addTimestamp 
      ? `${path}${hasQueryParams ? '&' : '?'}t=${Date.now()}` 
      : path;
  }
  
  // 移除路径开头的斜杠(如果有)
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // 修正：静态资源通常直接从服务器根目录访问，而不是通过API路径
  // 静态资源应该通过SERVER_URL访问
  return addTimestamp 
    ? `${SERVER_URL}/${cleanPath}?t=${Date.now()}` 
    : `${SERVER_URL}/${cleanPath}`;
};

// 使用模拟数据的标志 - 设置为false使用真实API
export const USE_MOCK = false;

// API请求超时设置（毫秒）
export const API_TIMEOUT = 10000;

// 请求头配置
export const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// 表单数据请求头配置
export const getFormDataHeaders = (token) => {
  const headers = {
    'Content-Type': 'multipart/form-data',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// API端点
export const API_ENDPOINTS = {
  // 用户相关
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  GET_USER: '/users/me',
  UPDATE_AVATAR: '/users/avatar',
  UPDATE_NICKNAME: '/users/nickname',
  
  // 游记相关
  GET_TRAVELS: '/travels',
  GET_TRAVEL: '/travels/:id',
  CREATE_TRAVEL: '/travels',
  UPDATE_TRAVEL: '/travels/:id',
  DELETE_TRAVEL: '/travels/:id',
  GET_MY_TRAVELS: '/travels/my',
  
  // 上传相关
  UPLOAD_IMAGES: '/upload/images',
  UPLOAD_VIDEO: '/upload/video',
  UPLOAD_AVATAR: '/upload/avatar'
}; 