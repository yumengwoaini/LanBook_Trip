import axios from 'axios';
import { getToken, logout } from './auth';
import { message } from 'antd';

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // 后端API的base URL
  timeout: 10000, // 请求超时时间
  withCredentials: true // 允许跨域请求携带凭证
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 如果存在token，则附带在请求头中
    const token = getToken();
    if (token) {
      // 确保token格式正确
      config.headers['Authorization'] = `Bearer ${token.trim()}`;
      console.log('发送请求，token:', token);
    } else {
      console.log('未找到token');
    }
    return config;
  },
  error => {
    // 处理请求错误
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 直接返回响应数据
    return response.data;
  },
  error => {
    // 处理错误响应
    const { response } = error;
    
    if (response) {
      // 401: 未授权(token无效或已过期)
      if (response.status === 401) {
        const errorMessage = response.data?.message || '登录已过期，请重新登录';
        message.error(errorMessage);
        
        // 清除认证信息
        logout();
        
        // 如果不是游记列表接口，则跳转到登录页
        if (!error.config.url.includes('/travels/admin/all')) {
          window.location.href = '/login';
        }
      } else {
        // 其他错误处理
        const errorMessage = response.data?.message || '服务器错误';
        message.error(errorMessage);
      }
    } else {
      message.error('网络错误，无法连接到服务器');
    }
    
    return Promise.reject(error);
  }
);

export default request; 