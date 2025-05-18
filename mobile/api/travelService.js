import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getHeaders, getFormDataHeaders, USE_MOCK } from './config';
import { mockTravels, mockMyTravels } from './mockData';

// 获取token
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('获取token失败:', error);
    return null;
  }
};

// 获取当前用户
const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

// 获取所有游记（已审核通过）
export const getTravels = async (page = 1, limit = 10, keyword = '') => {
  // 使用模拟数据
  if (USE_MOCK) {
    // 过滤已通过状态的游记
    let filteredTravels = mockTravels.filter(travel => travel.status === 'approved');
    
    // 如果有关键词，进行搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredTravels = filteredTravels.filter(travel => 
        travel.title.toLowerCase().includes(lowerKeyword) || 
        travel.author.nickname.toLowerCase().includes(lowerKeyword)
      );
    }
    
    // 计算分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTravels = filteredTravels.slice(startIndex, endIndex);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: paginatedTravels,
      page,
      limit,
      total: filteredTravels.length,
      pages: Math.ceil(filteredTravels.length / limit)
    };
  }
  
  try {
    const token = await getToken();
    let url = `${API_URL}/travels?page=${page}&limit=${limit}`;
    
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('获取游记列表失败:', data.message);
      // 如果API请求失败，返回空数据并保持一致的数据结构
      return {
        success: false,
        message: data.message || '获取游记列表失败',
        data: [],
        page: 1,
        limit,
        total: 0,
        pages: 0
      };
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('获取游记列表错误:', error);
    // 出现网络错误时，返回空数据并保持一致的数据结构
    return {
      success: false,
      message: '网络错误，请检查网络连接',
      data: [],
      page: 1,
      limit,
      total: 0,
      pages: 0
    };
  }
};

// 获取单个游记详情
export const getTravel = async (travelId) => {
  // 使用模拟数据
  if (USE_MOCK) {
    // 从所有游记和我的游记中查找
    const allTravels = [...mockTravels, ...mockMyTravels];
    const travel = allTravels.find(t => t.id === travelId);
    
    if (!travel) {
      throw new Error('游记不存在');
    }
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: travel
    };
  }
  
  try {
    const token = await getToken();
    const response = await fetch(`${API_URL}/travels/${travelId}`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    
    if (!response.ok) {
      let errorBody = '无法读取响应体';
      try {
        // 尝试将响应体解析为文本。如果服务器返回的是JSON错误，这可能需要调整为 response.text()
        errorBody = await response.text(); 
      } catch (e) {
        console.error('读取错误响应体失败:', e);
      }
      console.error(`获取游记详情失败 - 状态: ${response.status}, 响应体: ${errorBody}`);
      throw new Error(`获取游记详情失败，状态码: ${response.status}`);
    }
    
    // 如果response.ok为true，再尝试解析JSON
    const responseData = await response.json();
    // 检查后端返回的数据结构是否包含 success 标志 和 data 字段
    if (responseData && typeof responseData.success === 'boolean' && responseData.data) {
        return responseData; // 后端返回了期望的 { success: true, data: {...} }
    } else {
        // 如果后端直接返回了游记对象，但没有包装在 { success: true, data: ... }
        // 我们需要手动包装一下以保持前端其他地方处理逻辑的一致性
        console.warn('后端返回的游记详情数据结构与预期不符，将尝试手动包装。');
        return { success: true, data: responseData };
    }

  } catch (error) {
    // 避免重复打印已在上面处理过的HTTP错误信息
    if (!(error.message && error.message.startsWith('获取游记详情失败，状态码:'))) {
        console.error('获取游记详情时发生网络或未知错误:', error);
    }
    throw error;
  }
};

// 创建游记
export const createTravel = async (travelData) => {
  // 使用模拟数据
  if (USE_MOCK) {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('未登录');
    }
    
    // 创建新游记
    const newTravel = {
      id: (mockTravels.length + mockMyTravels.length + 1).toString(),
      title: travelData.title,
      content: travelData.content,
      images: ['uploads/default-travel.jpg'], // 使用默认图片
      video: travelData.video ? 'uploads/default-travel.jpg' : null,
      author: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加到我的游记
    mockMyTravels.push(newTravel);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: newTravel
    };
  }
  
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('未登录');
    }
    
    // 准备表单数据
    const formData = new FormData();
    formData.append('title', travelData.title);
    formData.append('content', travelData.content);
    
    // 添加图片
    if (travelData.images && travelData.images.length > 0) {
      travelData.images.forEach((image, index) => {
        const fileName = image.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('images', {
          uri: image.uri,
          name: fileName,
          type,
        });
      });
    }
    
    // 添加视频（如果有）
    if (travelData.video) {
      const fileName = travelData.video.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `video/${match[1]}` : 'video/mp4';
      
      formData.append('video', {
        uri: travelData.video.uri,
        name: fileName,
        type,
      });
    }
    
    const response = await fetch(`${API_URL}/travels`, {
      method: 'POST',
      headers: getFormDataHeaders(token),
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '创建游记失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('创建游记错误:', error);
    throw error;
  }
};

// 更新游记
export const updateTravel = async (travelId, travelData) => {
  // 使用模拟数据
  if (USE_MOCK) {
    // 查找游记
    const travelIndex = mockMyTravels.findIndex(t => t.id === travelId);
    
    if (travelIndex === -1) {
      throw new Error('游记不存在');
    }
    
    // 更新游记
    mockMyTravels[travelIndex] = {
      ...mockMyTravels[travelIndex],
      title: travelData.title,
      content: travelData.content,
      status: 'pending', // 重新设为待审核
      updatedAt: new Date().toISOString()
    };
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: mockMyTravels[travelIndex]
    };
  }
  
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('未登录');
    }
    
    // 准备表单数据
    const formData = new FormData();
    formData.append('title', travelData.title);
    formData.append('content', travelData.content);
    
    // 添加新图片（如果有）
    if (travelData.newImages && travelData.newImages.length > 0) {
      travelData.newImages.forEach((image, index) => {
        const fileName = image.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('newImages', {
          uri: image.uri,
          name: fileName,
          type,
        });
      });
    }
    
    // 添加新视频（如果有）
    if (travelData.newVideo) {
      const fileName = travelData.newVideo.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `video/${match[1]}` : 'video/mp4';
      
      formData.append('newVideo', {
        uri: travelData.newVideo.uri,
        name: fileName,
        type,
      });
    }
    
    const response = await fetch(`${API_URL}/travels/${travelId}`, {
      method: 'PUT',
      headers: getFormDataHeaders(token),
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '更新游记失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('更新游记错误:', error);
    throw error;
  }
};

// 删除游记
export const deleteTravel = async (travelId) => {
  // 使用模拟数据
  if (USE_MOCK) {
    // 查找游记
    const travelIndex = mockMyTravels.findIndex(t => t.id === travelId);
    
    if (travelIndex === -1) {
      throw new Error('游记不存在');
    }
    
    // 删除游记
    mockMyTravels.splice(travelIndex, 1);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      message: '删除成功'
    };
  }
  
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('未登录');
    }
    
    const response = await fetch(`${API_URL}/travels/${travelId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('删除游记失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('删除游记错误:', error);
    throw error;
  }
};

// 获取当前用户的游记
export const getMyTravels = async (page = 1, limit = 10) => {
  // 使用模拟数据
  if (USE_MOCK) {
    // 计算分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTravels = mockMyTravels.slice(startIndex, endIndex);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: paginatedTravels,
      page,
      limit,
      total: mockMyTravels.length,
      pages: Math.ceil(mockMyTravels.length / limit)
    };
  }
  
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: '未登录，请先登录',
        data: [],
        page: 1,
        limit,
        total: 0,
        pages: 0
      };
    }
    
    const response = await fetch(`${API_URL}/travels/my?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('获取我的游记失败:', data.message);
      return {
        success: false,
        message: data.message || '获取我的游记失败',
        data: [],
        page: 1,
        limit,
        total: 0,
        pages: 0
      };
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('获取我的游记错误:', error);
    return {
      success: false,
      message: '网络错误，请检查网络连接',
      data: [],
      page: 1,
      limit,
      total: 0,
      pages: 0
    };
  }
}; 