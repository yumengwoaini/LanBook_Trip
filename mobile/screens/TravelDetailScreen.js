import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { Video } from 'expo-av';
import { getTravel } from '../api/travelService';
import { getFullResourceUrl } from '../api/config';

const { width, height } = Dimensions.get('window');

// Helper function to ensure path has correct prefix
const ensurePrefixedPath = (path, prefix) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith(prefix)) {
    return path;
  }
  return `${prefix}${path}`;
};

const TravelDetailScreen = ({ route, navigation }) => {
  const { travelId } = route.params;
  const [travel, setTravel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const flatListRef = useRef(null);
  
  // 获取游记详情
  const loadTravelDetail = async () => {
    try {
      setLoading(true);
      const response = await getTravel(travelId);
      setTravel(response.data);
    } catch (error) {
      console.error('获取游记详情失败:', error);
      setError('获取游记详情失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化加载
  useEffect(() => {
    loadTravelDetail();
  }, [travelId]);
  
  // 处理图片滚动
  const handleImageScroll = (event) => {
    const slideIndex = Math.floor(
      event.nativeEvent.contentOffset.x / (width - 32)
    );
    setCurrentImageIndex(slideIndex);
  };
  
  // 分享游记
  const handleShare = async () => {
    if (!travel) return;
    
    try {
      const result = await Share.share({
        title: travel.title,
        message: `我在蓝书发现了一篇精彩的游记: ${travel.title}，快来看看吧！`,
        url: `https://your-app-domain.com/travels/${travel.id || travel._id}`
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`分享至: ${result.activityType}`);
        } else {
          console.log('分享成功');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('分享已取消');
      }
    } catch (error) {
      Alert.alert('分享失败', error.message);
    }
  };
  
  // 打开地图导航
  const handleOpenNavigation = () => {
    // 这里应该有游记定位信息，示例使用北京坐标
    const latitude = 39.9042;
    const longitude = 116.4074;
    const label = travel?.title || '游记位置';
    
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}${latLng}?q=${label}`
    });
    
    Linking.openURL(url);
  };
  
  // 查看大图
  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };
  
  const authorAvatarSource = () => {
    if (travel?.author?.avatar && travel.author.avatar !== 'default-avatar.png' && !travel.author.avatar.startsWith('http')) {
      return { uri: getFullResourceUrl(ensurePrefixedPath(travel.author.avatar, 'avatars/'), false) };
    } else if (travel?.author?.avatar && travel.author.avatar.startsWith('http')) {
      return { uri: travel.author.avatar };
    }
    return require('../assets/images/default-avatar.png');
  };
  
  // 渲染图片项
  const renderImageItem = ({ item, index }) => {
    const imagePath = ensurePrefixedPath(item, 'images/');
    return (
      <TouchableOpacity
        style={styles.imageItem}
        onPress={() => openImageViewer(index)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: getFullResourceUrl(imagePath, false) }}
          style={styles.slideImage}
          resizeMode="cover"
          onError={(e) => console.log('游记图片加载错误:', imagePath, e.nativeEvent.error)}
        />
      </TouchableOpacity>
    );
  };
  
  // 渲染图片指示器
  const renderImageIndicator = () => {
    if (!travel || !travel.images || travel.images.length <= 1) return null;
    
    return (
      <View style={styles.indicatorContainer}>
        {travel.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentImageIndex && styles.activeIndicator
            ]}
          />
        ))}
      </View>
    );
  };
  
  // 渲染地图
  const renderMap = () => {
    // 示例使用北京坐标，实际应从游记数据中获取
    const latitude = 39.9042;
    const longitude = 116.4074;
    
    return (
      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>位置信息</Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={travel?.title}
            description={travel?.author?.nickname || '游客'}
          />
        </MapView>
        
        <View style={styles.mapButtonsContainer}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleOpenNavigation}
          >
            <Ionicons name="navigate" size={18} color="#1DA1F2" />
            <Text style={styles.mapButtonText}>导航到此处</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              // 这里可以实现查看周边兴趣点功能
              Alert.alert('提示', '查看周边功能尚未实现');
            }}
          >
            <Ionicons name="search" size={18} color="#1DA1F2" />
            <Text style={styles.mapButtonText}>周边兴趣点</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (loading) {
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
  
  if (!travel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={60} color="#ddd" />
        <Text style={styles.errorText}>未找到游记</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{travel.title}</Text>
        
        <View style={styles.authorContainer}>
          <Image
            source={authorAvatarSource()}
            style={styles.authorAvatar}
            onError={(e) => console.log('详情页作者头像加载错误(尝试后):', travel?.author?.avatar, e.nativeEvent.error)}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{travel.author?.nickname || '匿名用户'}</Text>
            <Text style={styles.publishDate}>{new Date(travel.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        {travel.images && travel.images.length > 0 && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={travel.images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => `image-${index}-${item}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              style={styles.carousel}
              contentContainerStyle={styles.carouselContent}
            />
            {renderImageIndicator()}
          </View>
        )}
        
        {travel.video && (
          <View style={styles.videoContainer}>
            <Text style={styles.sectionTitle}>相关视频</Text>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: getFullResourceUrl(ensurePrefixedPath(travel.video, 'videos/'), false) }}
              useNativeControls
              resizeMode="contain"
              onError={(e) => console.log('视频加载错误:', travel.video, e)}
            />
          </View>
        )}
        
        <View style={styles.contentBody}>
          <Text style={styles.contentText}>{travel.content}</Text>
        </View>
        
        {renderMap()}
        
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={24} color="#1DA1F2" />
            <Text style={styles.actionButtonText}>分享</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#1DA1F2" />
            <Text style={styles.actionButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: getFullResourceUrl(ensurePrefixedPath(travel.images?.[currentImageIndex], 'images/'), false) }}
            style={styles.fullImage}
            resizeMode="contain"
            onError={(e) => console.log('全屏图片加载错误:', travel.images?.[currentImageIndex], e.nativeEvent.error)}
          />
          
          <View style={styles.imageViewerIndicator}>
            <Text style={styles.imageViewerText}>
              {currentImageIndex + 1} / {travel.images?.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  publishDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  carouselContainer: {
    marginBottom: 20,
  },
  carousel: {
    paddingRight: 16,
  },
  carouselContent: {
    paddingRight: 16,
  },
  imageItem: {
    width: width - 32,
    height: width * 0.7,
    marginRight: 16,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#1DA1F2',
  },
  videoContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: width * 0.7,
  },
  contentBody: {
    marginBottom: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  mapContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f5f9',
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  mapButtonText: {
    marginLeft: 6,
    color: '#1DA1F2',
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 14,
    color: '#1DA1F2',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width,
    height: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  imageViewerIndicator: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  imageViewerText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default TravelDetailScreen; 