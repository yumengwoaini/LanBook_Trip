import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getTravel, updateTravel } from '../api/travelService';
import { API_URL } from '../api/config';

const EditTravelScreen = ({ route, navigation }) => {
  const { travelId } = route.params;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedImage, setDraggedImage] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [error, setError] = useState(null);

  // 加载游记详情
  useEffect(() => {
    loadTravelDetail();
  }, [travelId]);

  const loadTravelDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getTravel(travelId);
      const travel = response.data;

      setTitle(travel.title);
      setContent(travel.content);
      
      // 处理已有图片
      setExistingImages(
        travel.images.map(path => ({
          path,
          uri: `${API_URL}/${path}`,
          isExisting: true
        }))
      );
      
      // 处理已有视频
      if (travel.video) {
        setVideo({
          path: travel.video,
          uri: `${API_URL}/${travel.video}`,
          isExisting: true
        });
      }
    } catch (error) {
      console.error('加载游记详情失败:', error);
      setError('加载游记详情失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 请求权限
  useEffect(() => {
    (async () => {
      try {
        const cameraRollPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!cameraRollPermission.granted) {
          Alert.alert('需要权限', '需要访问相册权限才能选择图片和视频');
        }
      } catch (error) {
        console.error('请求权限失败:', error);
      }
    })();
  }, []);

  // 选择新图片
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        // 限制最多9张图片
        if (existingImages.length + newImages.length + result.assets.length > 9) {
          Alert.alert('提示', '最多只能上传9张图片');
          return;
        }

        setNewImages(prevImages => [...prevImages, ...result.assets]);
      }
    } catch (error) {
      console.error('选择图片错误:', error);
      Alert.alert('提示', '选择图片失败，请重试');
    }
  };

  // 选择新视频
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewVideo(result.assets[0]);
      }
    } catch (error) {
      console.error('选择视频错误:', error);
      Alert.alert('提示', '选择视频失败，请重试');
    }
  };

  // 删除已有图片
  const removeExistingImage = (index) => {
    setExistingImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // 删除新图片
  const removeNewImage = (index) => {
    setNewImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // 删除已有视频
  const removeExistingVideo = () => {
    setVideo(null);
  };

  // 删除新视频
  const removeNewVideo = () => {
    setNewVideo(null);
  };

  // 合并所有图片（用于展示）
  const getAllImages = () => {
    return [...existingImages, ...newImages];
  };

  // 开始拖拽图片
  const startDragging = (index) => {
    setDraggedImage(getAllImages()[index]);
  };

  // 结束拖拽，重新排序图片
  const endDragging = () => {
    if (draggedImage !== null && dropIndex !== null) {
      const allImages = getAllImages();
      const draggedIndex = allImages.findIndex(img => 
        img.uri === draggedImage.uri && img.isExisting === draggedImage.isExisting
      );
      
      if (draggedIndex !== -1 && dropIndex !== draggedIndex) {
        // 创建新的排序
        const reorderedImages = [...allImages];
        reorderedImages.splice(draggedIndex, 1);
        reorderedImages.splice(dropIndex, 0, draggedImage);
        
        // 分离已有图片和新图片
        const newExistingImages = reorderedImages.filter(img => img.isExisting);
        const newNewImages = reorderedImages.filter(img => !img.isExisting);
        
        setExistingImages(newExistingImages);
        setNewImages(newNewImages);
      }
    }
    
    // 重置状态
    setDraggedImage(null);
    setDropIndex(null);
  };

  // 设置拖放位置
  const setDropPosition = (index) => {
    setDropIndex(index);
  };

  // 设置封面图（移动到第一位）
  const setCoverImage = (index) => {
    if (index === 0) return; // 已经是封面
    
    const allImages = getAllImages();
    const coverImage = allImages[index];
    const restImages = allImages.filter((_, i) => i !== index);
    
    // 创建新的排序
    const reorderedImages = [coverImage, ...restImages];
    
    // 分离已有图片和新图片
    const newExistingImages = reorderedImages.filter(img => img.isExisting);
    const newNewImages = reorderedImages.filter(img => !img.isExisting);
    
    setExistingImages(newExistingImages);
    setNewImages(newNewImages);
    
    Alert.alert('提示', '已设置为封面图');
  };

  // 渲染图片项
  const renderImageItem = ({ item, index }) => {
    const isExistingImage = item.isExisting;
    
    return (
      <View
        style={[
          styles.imageContainer,
          draggedImage && draggedImage.uri === item.uri && styles.draggingImage,
          dropIndex === index && styles.dropTarget
        ]}
        onTouchStart={() => startDragging(index)}
        onTouchEnd={endDragging}
        onTouchMove={() => setDropPosition(index)}
      >
        <Image source={{ uri: item.uri }} style={styles.image} />
        
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.imageActionButton}
            onPress={() => {
              isExistingImage 
                ? removeExistingImage(existingImages.findIndex(img => img.uri === item.uri))
                : removeNewImage(newImages.findIndex(img => img.uri === item.uri));
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.imageActionButton, index === 0 && styles.disabledButton]}
            onPress={() => setCoverImage(index)}
            disabled={index === 0}
          >
            <Ionicons name="star-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {index === 0 && (
          <View style={styles.coverBadge}>
            <Text style={styles.coverText}>封面</Text>
          </View>
        )}
      </View>
    );
  };

  // 表单验证
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入游记标题');
      return false;
    }

    if (!content.trim()) {
      Alert.alert('提示', '请输入游记内容');
      return false;
    }

    if (existingImages.length + newImages.length === 0) {
      Alert.alert('提示', '请至少上传一张图片');
      return false;
    }

    return true;
  };

  // 更新游记
  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // 创建更新数据
      const travelData = {
        title,
        content,
        newImages,
        newVideo
      };

      // 发送请求
      const response = await updateTravel(travelId, travelData);

      Alert.alert(
        '更新成功',
        '游记已更新，正在等待审核',
        [
          {
            text: '确定',
            onPress: () => navigation.navigate('MyTravels')
          }
        ]
      );
    } catch (error) {
      console.error('更新游记失败:', error);
      Alert.alert('更新失败', '请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DA1F2" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadTravelDetail}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>标题</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="输入游记标题（必填）"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <View style={styles.titleCounter}>
            <Text style={styles.counterText}>{title.length}/100</Text>
          </View>
          
          <Text style={styles.label}>正文</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="记录旅途中的精彩故事（必填）"
            placeholderTextColor="#aaa"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          
          <Text style={styles.label}>图片</Text>
          <Text style={styles.hint}>
            至少上传一张图片，最多9张，首张图片为封面图，可拖拽调整顺序
          </Text>
          
          {getAllImages().length > 0 ? (
            <FlatList
              data={getAllImages()}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => `image-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageList}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="images-outline" size={60} color="#ddd" />
              <Text style={styles.placeholderText}>未选择图片</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.uploadButton, getAllImages().length >= 9 && styles.disabledButton]}
            onPress={pickImages}
            disabled={getAllImages().length >= 9}
          >
            <Ionicons name="image-outline" size={24} color="#1DA1F2" />
            <Text style={styles.uploadButtonText}>
              {getAllImages().length === 0 ? '选择图片' : '添加更多图片'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.label}>视频（可选）</Text>
          <Text style={styles.hint}>
            可以上传一个视频，最长60秒
          </Text>
          
          {newVideo ? (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: newVideo.uri }}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle-outline" size={40} color="#fff" />
              </View>
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={removeNewVideo}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : video ? (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: video.uri }}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle-outline" size={40} color="#fff" />
              </View>
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={removeExistingVideo}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickVideo}
            >
              <Ionicons name="videocam-outline" size={24} color="#1DA1F2" />
              <Text style={styles.uploadButtonText}>选择视频</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.updateButton, isSubmitting && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.updateButtonText}>更新游记</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: '#f5f8fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  titleCounter: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  counterText: {
    fontSize: 12,
    color: '#666',
  },
  contentInput: {
    backgroundColor: '#f5f8fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 150,
  },
  placeholderContainer: {
    height: 150,
    backgroundColor: '#f5f8fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#aaa',
  },
  imageList: {
    paddingVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  draggingImage: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  dropTarget: {
    borderWidth: 2,
    borderColor: '#1DA1F2',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
  },
  imageActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(29, 161, 242, 0.8)',
    paddingVertical: 4,
  },
  coverText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f8fa',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1DA1F2',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1DA1F2',
  },
  videoContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  updateButton: {
    flex: 2,
    backgroundColor: '#1DA1F2',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditTravelScreen; 