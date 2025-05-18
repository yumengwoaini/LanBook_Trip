// 用户角色
export const ROLES = {
  ADMIN: 'admin',
  REVIEWER: 'reviewer'
};

// 存储令牌
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 获取令牌
export const getToken = () => {
  return localStorage.getItem('token');
};

// 移除令牌
export const removeToken = () => {
  localStorage.removeItem('token');
};

// 存储用户信息
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// 获取用户信息
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// 移除用户信息
export const removeUser = () => {
  localStorage.removeItem('user');
};

// 检查是否已认证
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// 检查用户角色
export const hasRole = (role) => {
  const user = getUser();
  return user && user.role === role;
};

// 检查是否为管理员
export const isAdmin = () => {
  return hasRole(ROLES.ADMIN);
};

// 清除所有认证信息
export const clearAuth = () => {
  removeToken();
  removeUser();
};

// 登录
export const login = (token, user) => {
  setToken(token);
  setUser(user);
};

// 获取登录状态确保登录成功后，token
export const setLoginState = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getLoginState = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  return { token, user };
};

export const clearLoginState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 登出
export const logout = () => {
  removeToken();
  removeUser();
}; 