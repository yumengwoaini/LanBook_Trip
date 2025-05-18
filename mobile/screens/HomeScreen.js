import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Alert,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TravelCard from '../components/TravelCard';
import { getTravels } from '../api/travelService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../api/config';

// 辅助函数：确保路径前缀正确
const ensurePrefixedPath = (path, prefix) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('uploads/') || path.startsWith(prefix)) {
    return path;
  }
  return `${prefix}${path}`;
};

// 辅助函数：获取完整资源URL
const getFullResourceUrl = (path, useCache = true) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cacheBuster = useCache ? `?t=${new Date().getTime()}` : '';
  return `${API_URL}/uploads/${path}${cacheBuster}`;
};

// 辅助函数：获取头像URL
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar === 'default-avatar.png') return require('../assets/images/default-avatar.png');
  return { uri: getFullResourceUrl(ensurePrefixedPath(avatar, 'avatars/'), false) };
};

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 16;

const HomeScreen = ({ navigation }) => {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { logout, authState } = useAuth();
  const { isDarkMode, theme } = useTheme();

  // 加载游记数据
  const loadTravels = async (pageNum = 1, searchKeyword = '') => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      
      const response = await getTravels(pageNum, 10, searchKeyword);
      
      if (pageNum === 1) {
        setTravels(response.data);
      } else {
        setTravels(prevTravels => [...prevTravels, ...response.data]);
      }
      
      setHasMore(response.page < response.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('加载游记失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 首次加载
  useEffect(() => {
    loadTravels();
  }, []);

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadTravels(1, keyword);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadTravels(page + 1, keyword);
  };

  // 搜索游记
  const handleSearch = () => {
    loadTravels(1, keyword);
    setSearchVisible(false);
  };

  // 跳转到我的游记页面
  const goToMyTravels = () => {
    navigation.navigate('MyTravels');
  };

  // 回到顶部
  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // 处理滚动事件
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: event => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowScrollTop(offsetY > 300);
      }
    }
  );

  // 退出登录
  const handleLogout = () => {
    Alert.alert(
      "退出登录",
      "确定要退出登录吗？",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "确定",
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              // 导航将自动回到登录页，因为AuthContext状态改变
            } else {
              Alert.alert("错误", result.message || "退出登录失败，请重试");
            }
          }
        }
      ]
    );
  };

  // 渲染游记卡片
  const renderTravelItem = ({ item, index }) => (
    <View style={[
      styles.cardContainer,
      { 
        marginLeft: index % 2 === 0 ? 0 : 8, 
        marginRight: index % 2 === 0 ? 8 : 0,
        backgroundColor: theme.card
      }
    ]}>
      <TravelCard travel={item} cardWidth={COLUMN_WIDTH} isDarkMode={isDarkMode} />
    </View>
  );

  // 渲染列表头部（搜索框）
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.divider }]}>
      <View style={styles.headerTopRow}>
        <Text style={[styles.appTitle, { color: theme.primary }]}>蓝书</Text>
        <TouchableOpacity
          style={[styles.avatarContainer, { borderColor: theme.primary }]}
          onPress={() => setMenuVisible(true)}
        >
          <Image
            source={getAvatarUrl(authState.user?.avatar)}
            style={styles.avatar}
            key={authState.user ? (authState.user.avatar || authState.user._updateTimestamp || 'default') : 'default-avatar'}
            onError={(e) => {
              console.error('顶部用户头像加载错误:', authState.user?.avatar, e.nativeEvent.error);
            }}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
        onPress={() => setSearchVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={20} color={theme.icon} />
        <Text style={[styles.searchPlaceholder, { color: theme.placeholder }]}>搜索游记或作者</Text>
      </TouchableOpacity>

      {searchVisible && (
        <Modal
          transparent={true}
          visible={searchVisible}
          animationType="fade"
          onRequestClose={() => setSearchVisible(false)}
        >
          <View style={styles.searchModalContainer}>
            <View style={[styles.searchModalContent, { backgroundColor: theme.headerBackground, borderBottomColor: theme.divider }]}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                  placeholder="搜索游记或作者"
                  placeholderTextColor={theme.placeholder}
                  value={keyword}
                  onChangeText={setKeyword}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: theme.primary }]}
                  onPress={handleSearch}
                >
                  <Ionicons name="search" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setSearchVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.primary }]}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  // 渲染底部加载器
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.subtitle }]}>正在加载更多...</Text>
      </View>
    );
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="images-outline" size={60} color={theme.icon} />
        <Text style={[styles.emptyText, { color: theme.subtitle }]}>
          {keyword ? `没有找到与"${keyword}"相关的游记` : '暂无游记'}
        </Text>
        {keyword && (
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: theme.inputBackground }]}
            onPress={() => {
              setKeyword('');
              loadTravels(1, '');
            }}
          >
            <Text style={[styles.resetButtonText, { color: theme.primary }]}>清除搜索</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 渲染用户菜单
  const renderUserMenu = () => (
    <Modal
      transparent={true}
      visible={menuVisible}
      animationType="fade"
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1} 
        onPress={() => setMenuVisible(false)}
      >
        <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.menuHeader, { backgroundColor: theme.inputBackground, borderBottomColor: theme.divider }]}>
            <Image
              source={getAvatarUrl(authState.user?.avatar)}
              style={[styles.menuAvatar, { borderColor: theme.primary }]}
              key={authState.user ? (authState.user.avatar || authState.user._updateTimestamp || 'default') : 'default-avatar'}
              onError={(e) => {
                console.error('菜单用户头像加载错误:', authState.user?.avatar, e.nativeEvent.error);
              }}
            />
            <Text style={[styles.menuUsername, { color: theme.text }]}>
              {authState.user ? authState.user.nickname || authState.user.username : '游客'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.divider }]}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('MyTravels');
            }}
          >
            <Ionicons name="document-text-outline" size={22} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>我的游记</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItemLogout}
            onPress={() => {
              setMenuVisible(false);
              handleLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={styles.menuItemTextLogout}>退出登录</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBackground} />
      
      {renderHeader()}
      
      {renderUserMenu()}
      
      {loading && page === 1 ? (
        <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loaderText, { color: theme.subtitle }]}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={travels}
          renderItem={renderTravelItem}
          keyExtractor={(item) => item.id || item._id}
          numColumns={2}
          contentContainerStyle={[styles.listContent, { backgroundColor: theme.background }]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={theme.card}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}
      
      {showScrollTop && (
        <TouchableOpacity
          style={[styles.scrollTopButton, { backgroundColor: `${theme.primary}CC` }]}
          onPress={scrollToTop}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 75 : 48,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginLeft: 8,
    marginTop: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1DA1F2',
    marginRight: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  searchPlaceholder: {
    marginLeft: 12,
    color: '#657786',
    fontSize: 16,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  searchModalContent: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  searchButton: {
    backgroundColor: '#1DA1F2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    paddingHorizontal: 8,
  },
  cancelButtonText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 8,
    paddingBottom: 20,
  },
  cardContainer: {
    flex: 1,
    marginBottom: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f5f9',
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#1DA1F2',
    fontSize: 14,
  },
  scrollTopButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(29, 161, 242, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 88 : 64,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  menuHeader: {
    backgroundColor: '#f5f8fa',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#1DA1F2',
    marginBottom: 8,
  },
  menuUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  menuItemTextLogout: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 12,
  },
});

export default HomeScreen; 