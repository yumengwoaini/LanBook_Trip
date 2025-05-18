import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, register, logout, checkAuthState } from '../api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 创建上下文
const AuthContext = createContext();

// 创建提供者组件
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  // 初始化时检查认证状态
  useEffect(() => {
    const initAuth = async () => {
      const state = await checkAuthState();
      setAuthState({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        loading: false,
      });
    };

    initAuth();
  }, []);

  // 登录方法
  const handleLogin = async (username, password) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await login(username, password);
    
    if (result.success) {
      setAuthState({
        isAuthenticated: true,
        user: result.user,
        token: result.token,
        loading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
    
    return result;
  };

  // 注册方法
  const handleRegister = async (formData) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await register(formData);
    
    if (result.success) {
      setAuthState({
        isAuthenticated: true,
        user: result.user,
        token: result.token,
        loading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
    
    return result;
  };

  // 登出方法
  const handleLogout = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await logout();
    
    if (result.success) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
    
    return result;
  };

  // 更新用户信息方法
  const updateUserInfo = async (userData) => {
    if (authState.isAuthenticated && authState.user) {
      try {
        console.log('更新用户信息:', userData);
        const updatedUser = { ...authState.user, ...userData };

        // 添加更新时间戳，强制组件重新渲染
        updatedUser._updateTimestamp = new Date().getTime();
        
        // 更新状态
        setAuthState(prev => ({
          ...prev,
          user: updatedUser
        }));
        
        // 同步到本地存储
        const userJson = JSON.stringify(updatedUser);
        await AsyncStorage.setItem('user', userJson);
        console.log('用户信息已同步到本地存储');
        
        return true;
      } catch (error) {
        console.error('更新用户信息失败:', error);
        return false;
      }
    }
    return false;
  };

  // 提供的值
  const value = {
    authState,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateUserInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 创建钩子以便在组件中使用
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 