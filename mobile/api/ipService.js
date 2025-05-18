import { API_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 获取用户IP属地信息
 * @returns {Promise<Object>} - 返回IP属地信息
 */
export const getIPLocation = async () => {
  const response = await fetch('https://whois.pconline.com.cn/ipJson.jsp?json=true');
  const data = await response.json();
  const location = data.city || '未知';
  
  // 保存IP属地到本地存储
  await saveIPLocation(location);
  
  return {
    success: true,
    ipLocation: location,
  };
};

/**
 * 保存IP属地信息到本地存储
 * @param {string} location - IP属地
 */
export const saveIPLocation = async (location) => {
  await AsyncStorage.setItem('ip_location', location);
};

/**
 * 从本地获取IP属地信息
 * @returns {Promise<string>} - 返回存储的IP属地
 */
export const getStoredIPLocation = async () => {
  const location = await AsyncStorage.getItem('ip_location');
  return location || '未知';
}; 