import request from '../utils/request';

// 用户登录
export const login = (data) => {
  return request({
    url: '/users/login',
    method: 'post',
    data
  });
};

// 获取当前用户信息
export const getCurrentUser = () => {
  return request({
    url: '/users/me',
    method: 'get'
  });
};

// 退出登录
export const logout = () => {
  return request({
    url: '/users/logout',
    method: 'post'
  });
}; 