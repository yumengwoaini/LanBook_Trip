import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getHeaders, getFormDataHeaders, USE_MOCK } from './config';
import { mockUsers } from './mockData';

// 用户登录
export const login = async (username, password) => {
  // 使用模拟数据
  if (USE_MOCK) {
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return {
        success: false,
        message: '用户名或密码错误',
      };
    }
    
    // 生成模拟token
    const mockToken = `mock_token_${Date.now()}`;
    
    // 保存token和用户信息
    const userData = { ...user };
    delete userData.password; // 不存储密码
    
    await AsyncStorage.setItem('token', mockToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    return {
      success: true,
      user: userData,
      token: mockToken,
    };
  }
  
  // 使用真实API
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || '登录失败，请检查用户名和密码',
      };
    }
    
    // 保存token和用户信息
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    
    return {
      success: true,
      user: data.user,
      token: data.token,
    };
  } catch (error) {
    console.error('登录错误:', error);
    return {
      success: false,
      message: '登录失败，请检查网络连接',
    };
  }
};

// 用户注册
export const register = async (formData) => {
  // 使用模拟数据
  if (USE_MOCK) {
    // 从formData中获取数据
    const username = formData.get('username');
    const nickname = formData.get('nickname');
    
    // 检查用户名是否已存在
    if (mockUsers.some(u => u.username === username)) {
      return {
        success: false,
        message: '用户名已存在',
      };
    }
    
    // 创建新用户
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      username,
      nickname,
      avatar: 'uploads/default-avatar.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    
    // 生成模拟token
    const mockToken = `mock_token_${Date.now()}`;
    
    // 保存token和用户信息
    await AsyncStorage.setItem('token', mockToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    
    return {
      success: true,
      user: newUser,
      token: mockToken,
    };
  }
  
  // 使用真实API
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: getFormDataHeaders(),
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || '注册失败，请重试',
      };
    }
    
    // 注册成功后自动登录
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    
    return {
      success: true,
      user: data.user,
      token: data.token,
    };
  } catch (error) {
    console.error('注册错误:', error);
    return {
      success: false,
      message: '注册失败，请检查网络连接',
    };
  }
};

// 用户登出
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('登出错误:', error);
    return { 
      success: false,
      message: '登出失败'
    };
  }
};

// 检查认证状态
export const checkAuthState = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    
    if (!token || !userStr) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }
    
    const user = JSON.parse(userStr);
    
    // 在使用模拟数据的情况下，直接返回
    if (USE_MOCK) {
      return {
        isAuthenticated: true,
        user,
        token,
      };
    }
    
    // 验证token有效性 (如果后端提供验证接口)
    try {
      const response = await fetch(`${API_URL}/users/validate`, {
        method: 'GET',
        headers: getHeaders(token),
      });
      
      if (!response.ok) {
        // token无效，清除存储的信息
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        
        return {
          isAuthenticated: false,
          user: null,
        };
      }
    } catch (error) {
      console.error('验证token错误:', error);
      // 如果只是网络错误，仍然可以使用存储的token
    }
    
    return {
      isAuthenticated: true,
      user,
      token,
    };
  } catch (error) {
    console.error('检查认证状态错误:', error);
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}; 