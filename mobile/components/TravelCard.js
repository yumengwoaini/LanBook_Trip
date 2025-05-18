import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL, getFullResourceUrl } from '../api/config';

const { width } = Dimensions.get('window');
const DEFAULT_WIDTH = (width - 48) / 2;

// Helper function to ensure path has correct prefix
const ensurePrefixedPath = (path, prefix) => {
  if (!path) return null;
  // 如果已经是完整URL或已包含uploads/前缀（兼容旧数据）或正确的分类前缀，则直接返回
  if (path.startsWith('http') || path.startsWith('uploads/') || path.startsWith(prefix)) {
    return path;
  }
  return `${prefix}${path}`;
};

const TravelCard = ({ travel, cardWidth, isDarkMode }) => {
  const navigation = useNavigation();
  const imageWidth = cardWidth || DEFAULT_WIDTH;
  const imageHeight = imageWidth * 1.2;
  
  // 导航到游记详情页
  const handlePress = () => {
    navigation.navigate('TravelDetail', { travelId: travel.id || travel._id });
  };
  
  // 计算文本长度限制
  const getTitleLimit = () => {
    if (imageWidth < 130) return 8;
    if (imageWidth < 150) return 10;
    return 12;
  };
  
  // 截断标题
  const truncateTitle = (title) => {
    const limit = getTitleLimit();
    if (title.length <= limit) return title;
    return title.substring(0, limit) + '...';
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return '今天';
    } else if (diffDays < 2) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };
  
  const authorAvatarSource = () => {
    if (travel.author?.avatar && travel.author.avatar !== 'default-avatar.png' && !travel.author.avatar.startsWith('http')) {
      // 假设数据库中非默认头像路径已经是正确的相对路径，或者需要ensurePrefixedPath
      return { uri: getFullResourceUrl(ensurePrefixedPath(travel.author.avatar, 'avatars/'), false) };
    } else if (travel.author?.avatar && travel.author.avatar.startsWith('http')) {
      return { uri: travel.author.avatar }; // 如果已经是完整URL
    }
    return require('../assets/images/default-avatar.png');
  };
  
  const getCoverImageSource = () => {
    const defaultServerPath = 'default-travel.jpg'; // 您在后端配置的默认图片名
    const localDefaultImage = require('../assets/images/default-avatar.png'); // 本地默认图片资源

    if (travel.images && travel.images.length > 0) {
      const firstImage = travel.images[0];
      // 检查是否是已知的服务器端默认图片占位符，或者是否就是我们定义的defaultServerPath
      if (
        firstImage === 'images/default-image-1.jpg' || 
        firstImage === 'images/default-image-3.jpg' || 
        firstImage === defaultServerPath || // 后端可能直接存这个
        firstImage === 'uploads/images/default-travel.jpg' // 兼容旧的或不规范路径
      ) {
        return localDefaultImage;
      }
      // 否则，尝试加载网络图片
      return { uri: getFullResourceUrl(ensurePrefixedPath(firstImage, 'images/'), false) };
    }
    // 如果没有图片，或者以上都不是，则使用本地默认图片
    return localDefaultImage;
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.85}>
      <View style={[
        styles.card,
        {
          width: imageWidth,
          backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
        }
      ]}>
        <Image
          source={getCoverImageSource()}
          style={[
            styles.image,
            {
              width: imageWidth,
              height: imageHeight,
            }
          ]}
          resizeMode="cover"
          onError={(e) => console.log('卡片封面图加载错误(尝试后):', travel.images?.[0], e.nativeEvent.error)}
        />
        
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>
            {truncateTitle(travel.title)}
          </Text>
          
          <View style={styles.footer}>
            <View style={styles.author}>
              <Image
                source={authorAvatarSource()}
                style={styles.avatar}
                onError={(e) => console.log('卡片作者头像加载错误(尝试后):', travel.author?.avatar, e.nativeEvent.error)}
              />
              <Text style={styles.authorName} numberOfLines={1}>
                {travel.author?.nickname || '游客'}
              </Text>
            </View>
            
            <Text style={styles.date}>
              {formatDate(travel.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  authorName: {
    color: '#eee',
    fontSize: 12,
    flex: 1,
  },
  date: {
    color: '#ddd',
    fontSize: 10,
  },
});

export default TravelCard; 