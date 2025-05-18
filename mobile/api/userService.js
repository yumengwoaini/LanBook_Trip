import { API_URL, getHeaders, getFormDataHeaders, getFullResourceUrl } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 更新用户头像
 * @param {string} imageUri - 头像图片的URI
 * @returns {Promise<Object>} - 返回更新结果
 */
export const updateUserAvatar = async (imageUri) => {
  try {
    console.log('开始上传头像，图片路径:', imageUri);
    
    // 获取存储的认证信息
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('用户未登录');
    }

    // 创建FormData对象以上传图片
    const formData = new FormData();
    
    // 获取文件名
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // 判断文件类型
    const fileType = fileName.includes('.') 
      ? `image/${fileName.split('.').pop()}`
      : 'image/jpeg';
    
    // 添加图片文件到FormData
    formData.append('avatar', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    });

    console.log('准备发送请求到:', `${API_URL}/users/avatar`);
    
    // 发送请求
    const response = await fetch(`${API_URL}/users/avatar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('服务器响应:', data);

    if (!response.ok) {
      throw new Error(data.message || '更新头像失败');
    }

    // 生成完整的头像URL，暂时不加时间戳
    const fullAvatarUrl = getFullResourceUrl(data.avatar, false);
    console.log('处理后的头像URL (无时间戳):', fullAvatarUrl);
    
    // 不在这里更新用户信息，而是返回结果让调用方处理
    // 这样可以避免重复更新和可能的时间戳问题
    return {
      success: true,
      message: '头像更新成功',
      avatar: fullAvatarUrl,
    };
  } catch (error) {
    console.error('更新头像出错:', error);
    return {
      success: false,
      message: error.message || '更新头像失败，请重试',
    };
  }
};

/**
 * 获取用户信息
 * @returns {Promise<Object>} - 返回用户信息
 */
export const getUserInfo = async () => {
  try {
    // 获取存储的认证信息
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('用户未登录');
    }

    // 发送请求
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取用户信息失败');
    }

    // 确保头像URL完整
    if (data.user && data.user.avatar) {
      data.user.avatar = getFullResourceUrl(data.user.avatar, false);
    }

    // 更新本地存储的用户信息
    await AsyncStorage.setItem('user', JSON.stringify(data.user));

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('获取用户信息出错:', error);
    return {
      success: false,
      message: error.message || '获取用户信息失败，请重试',
    };
  }
}; 