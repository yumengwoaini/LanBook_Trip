import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Image,
  Modal,
  Platform,
  Dimensions,
  Switch,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import TravelCard from '../components/TravelCard';
import { getMyTravels, deleteTravel } from '../api/travelService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { updateUserAvatar } from '../api/userService';
import { getIPLocation, getStoredIPLocation } from '../api/ipService';
import { getFullResourceUrl } from '../api/config';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 24;

// Helper function to ensure path has correct prefix (从TravelCard.js复制过来)
const ensurePrefixedPath = (path, prefix) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('uploads/') || path.startsWith(prefix)) {
    return path;
  }
  return `${prefix}${path}`;
};

const MyTravelsScreen = ({ navigation }) => {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [allTravels, setAllTravels] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending'
  
  // 用户信息和设置相关状态
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('保密'); // '男', '女', '保密'
  const [showIPLocation, setShowIPLocation] = useState(true);
  const [ipLocation, setIpLocation] = useState('获取中...');
  
  const flatListRef = useRef(null);
  const isFocused = useIsFocused();
  const { authState, logout, updateUserInfo } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();

  // 在组件挂载时初始化用户信息和IP属地
  useEffect(() => {
    if (authState.user) {
      if (authState.user.age) setAge(authState.user.age.toString());
      if (authState.user.gender) setGender(authState.user.gender);
      
      // 加载存储的IP属地
      loadIPLocation();
    }
  }, [authState.user]);

  // 加载IP属地信息
  const loadIPLocation = async () => {
    try {
      // 首先尝试从本地存储获取
      const storedLocation = await getStoredIPLocation();
      setIpLocation(storedLocation);
      
      // 然后尝试自动获取最新的IP属地
      const result = await getIPLocation();
      if (result.success) {
        setIpLocation(result.ipLocation);
      }
    } catch (error) {
      console.error('加载IP属地失败:', error);
    }
  };

  // 保存用户信息
  const saveUserProfile = () => {
    const updatedInfo = {
      age: age ? parseInt(age) : undefined,
      gender
    };
    
    updateUserInfo(updatedInfo);
    setProfileModalVisible(false);
    Alert.alert('提示', '个人资料已更新');
  };

  // 保存设置
  const saveSettings = () => {
    const updatedSettings = {
      ipLocation: showIPLocation ? ipLocation : null
    };
    
    updateUserInfo(updatedSettings);
    setSettingsModalVisible(false);
    Alert.alert('提示', '设置已保存');
  };

  // 加载我的游记
  const loadMyTravels = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      
      const response = await getMyTravels(pageNum, 10);
      
      if (pageNum === 1) {
        setAllTravels(response.data);
        filterTravels(response.data, filter);
      } else {
        const newTravels = [...allTravels, ...response.data];
        setAllTravels(newTravels);
        filterTravels(newTravels, filter);
      }
      
      setHasMore(response.page < response.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('加载我的游记失败:', error);
      Alert.alert('提示', '加载游记失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 筛选游记
  const filterTravels = (travelsData, filterType) => {
    let filteredData = [...travelsData];
    
    if (filterType === 'approved') {
      filteredData = travelsData.filter(travel => travel.status === 'approved');
    } else if (filterType === 'pending') {
      // 获取待审核和未通过的游记
      filteredData = travelsData.filter(travel => 
        travel.status === 'pending' || travel.status === 'rejected'
      );
      
      // 将未通过的游记置顶
      filteredData.sort((a, b) => {
        if (a.status === 'rejected' && b.status !== 'rejected') return -1;
        if (a.status !== 'rejected' && b.status === 'rejected') return 1;
        return 0;
      });
    }
    
    setTravels(filteredData);
  };

  // 应用筛选
  const applyFilter = (filterType) => {
    setFilter(filterType);
    filterTravels(allTravels, filterType);
    
    // 回到顶部
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // 页面聚焦时重新加载数据
  useEffect(() => {
    if (isFocused) {
      loadMyTravels();
    }
  }, [isFocused]);

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadMyTravels(1);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadMyTravels(page + 1);
  };

  // 回到顶部
  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // 监听滚动事件
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowTopButton(offsetY > 300); // 当滚动超过300时显示回到顶部按钮
  };

  // 选择图片并更新头像
  const handleChangeAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('提示', '需要访问相册权限才能更换头像');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // 显示加载状态
        setLoading(true);
        
        console.log('选择的图片URI:', result.assets[0].uri);
        const response = await updateUserAvatar(result.assets[0].uri);
        console.log('头像更新响应 (avatar不带?t=):', response);
        
        if (response.success) {
          // 手动添加缓存破坏参数 v=<timestamp>
          const newAvatarUrlWithCacheBuster = `${response.avatar}${response.avatar.includes('?') ? '&' : '?'}v=${new Date().getTime()}`;
          console.log('添加缓存破坏参数后的URL:', newAvatarUrlWithCacheBuster);

          // 更新AuthContext中的用户信息，这将触发UI更新和Image组件的key变化
          updateUserInfo({ avatar: newAvatarUrlWithCacheBuster });
          
          // 用户提示
          Alert.alert('提示', '头像更新成功');
        } else {
          Alert.alert('提示', response.message || '头像更新失败');
        }
        // 隐藏加载状态
        setLoading(false);
      }
    } catch (error) {
      console.error('更换头像失败:', error);
      Alert.alert('提示', '更换头像失败，请重试');
      setLoading(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          onPress: async () => {
            try {
              const result = await logout();
              if (!result.success) {
                Alert.alert('提示', '退出登录失败，请重试');
              }
            } catch (error) {
              console.error('退出登录失败:', error);
              Alert.alert('提示', '退出登录失败，请重试');
            }
          }
        }
      ]
    );
  };

  // 编辑游记
  const handleEdit = (travel) => {
    if (travel.status === 'approved') {
      Alert.alert('提示', '已通过审核的游记不能编辑');
      return;
    }
    
    navigation.navigate('EditTravel', { travelId: travel.id || travel._id });
  };

  // 删除游记
  const handleDelete = (travel) => {
    Alert.alert(
      '确认删除',
      '确定要删除这篇游记吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteTravel(travel.id || travel._id);
              
              // 删除成功后刷新列表
              setTravels(prevTravels => 
                prevTravels.filter(item => (item.id || item._id) !== (travel.id || travel._id))
              );
              
              Alert.alert('提示', '游记已成功删除');
            } catch (error) {
              console.error('删除游记失败:', error);
              Alert.alert('提示', '删除游记失败，请重试');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 创建游记
  const handleCreate = () => {
    navigation.navigate('CreateTravel');
  };

  // 渲染顶部用户信息
  const renderHeader = () => {
    const userAvatarSource = () => {
      if (authState.user?.avatar && authState.user.avatar !== 'default-avatar.png' && !authState.user.avatar.startsWith('http')) {
        // 确保路径前缀正确
        return { uri: getFullResourceUrl(ensurePrefixedPath(authState.user.avatar, 'avatars/'), false) };
      } else if (authState.user?.avatar && authState.user.avatar.startsWith('http')) {
        // 如果已经是完整 HTTP URL
        return { uri: authState.user.avatar };
      }
      // 默认头像
      return require('../assets/images/default-avatar.png');
    };

    return (
      <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangeAvatar}
          >
            <Image 
              source={userAvatarSource()}
              style={styles.avatar} 
              key={authState.user ? (authState.user.avatar || authState.user._updateTimestamp || 'default') : 'default-avatar'}
              onError={(e) => {
                console.error('顶部用户头像加载错误:', authState.user?.avatar, e.nativeEvent.error);
              }}
            />
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.usernameContainer}>
              <Text style={[styles.username, { color: theme.text }]}>
                {authState.user ? authState.user.nickname || authState.user.username : '游客'}
              </Text>
              
              {gender !== '保密' && (
                <View style={[
                  styles.genderBadge, 
                  gender === '男' ? styles.maleBadge : styles.femaleBadge
                ]}>
                  <Ionicons 
                    name={gender === '男' ? 'male' : 'female'} 
                    size={12} 
                    color="#fff" 
                  />
                </View>
              )}
              
              {showIPLocation && ipLocation && (
                <View style={[styles.ipLocationContainer, { backgroundColor: theme.inputBackground }]}>
                  <Text style={[styles.ipLocationText, { color: theme.subtitle }]}>IP属地：{ipLocation}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 筛选按钮 */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'all' && styles.activeFilter,
              { backgroundColor: filter === 'all' ? theme.primary : theme.inputBackground }
            ]} 
            onPress={() => applyFilter('all')}
          >
            <Text style={[
              styles.filterText, 
              filter === 'all' && styles.activeFilterText,
              { color: filter === 'all' ? '#fff' : theme.subtitle }
            ]}>
              全部
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'approved' && styles.activeFilter,
              { backgroundColor: filter === 'approved' ? theme.primary : theme.inputBackground }
            ]} 
            onPress={() => applyFilter('approved')}
          >
            <Text style={[
              styles.filterText, 
              filter === 'approved' && styles.activeFilterText,
              { color: filter === 'approved' ? '#fff' : theme.subtitle }
            ]}>
              已通过
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              filter === 'pending' && styles.activeFilter,
              { backgroundColor: filter === 'pending' ? theme.primary : theme.inputBackground }
            ]} 
            onPress={() => applyFilter('pending')}
          >
            <Text style={[
              styles.filterText, 
              filter === 'pending' && styles.activeFilterText,
              { color: filter === 'pending' ? '#fff' : theme.subtitle }
            ]}>
              待审核
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>我的游记</Text>
      </View>
    );
  };

  // 渲染游记项
  const renderTravelItem = ({ item, index }) => (
    <View style={[
      styles.travelItem,
      { 
        marginLeft: index % 2 === 0 ? 0 : 8, 
        marginRight: index % 2 === 0 ? 8 : 0,
        backgroundColor: theme.card
      }
    ]}>
      <TravelCard travel={item} cardWidth={COLUMN_WIDTH} isDarkMode={isDarkMode} />
      
      <View style={[styles.statusContainer, { borderTopColor: theme.divider, backgroundColor: theme.card }]}>
          {item.status === 'pending' && (
            <View style={[styles.statusBadge, styles.pendingBadge]}>
              <Text style={styles.statusText}>审核中</Text>
            </View>
          )}
          
          {item.status === 'approved' && (
            <View style={[styles.statusBadge, styles.approvedBadge]}>
              <Text style={styles.statusText}>已通过</Text>
            </View>
          )}
          
          {item.status === 'rejected' && (
            <View style={styles.rejectContainer}>
              <View style={[styles.statusBadge, styles.rejectedBadge]}>
                <Text style={styles.statusText}>未通过</Text>
              </View>
              {item.rejectReason && (
                <Text style={styles.rejectReason}>
                  原因: {item.rejectReason}
                </Text>
              )}
            </View>
          )}
        </View>
        
      <View style={[styles.buttons, { borderTopColor: theme.divider }]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.status === 'approved' && styles.disabledButton
            ]}
            onPress={() => handleEdit(item)}
            disabled={item.status === 'approved'}
          >
            <Ionicons
              name="create-outline"
              size={20}
            color={item.status === 'approved' ? theme.buttonDisabled : theme.primary}
            />
            <Text
              style={[
                styles.actionButtonText,
              { color: item.status === 'approved' ? theme.buttonDisabled : theme.primary }
              ]}
            >
              编辑
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
              删除
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="document-text-outline" size={60} color={theme.icon} />
        <Text style={[styles.emptyText, { color: theme.subtitle }]}>您还没有发布任何游记</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.buttonPrimary }]}
          onPress={handleCreate}
        >
          <Text style={[styles.createButtonText, { color: theme.buttonText }]}>立即发布游记</Text>
        </TouchableOpacity>
      </View>
    );
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBackground} />
      
      {/* 退出登录菜单 */}
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
            <View style={[styles.menuHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>用户选项</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.divider }]}
              onPress={() => {
                setMenuVisible(false);
                setProfileModalVisible(true);
              }}
            >
              <Ionicons name="person-outline" size={22} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>个人资料</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.divider }]}
              onPress={() => {
                setMenuVisible(false);
                setSettingsModalVisible(true);
              }}
            >
              <Ionicons name="settings-outline" size={22} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>设置</Text>
            </TouchableOpacity>
            
            <View style={[styles.menuDivider, { backgroundColor: theme.divider }]} />
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
              <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* 个人资料编辑弹窗 */}
      <Modal
        transparent={true}
        visible={profileModalVisible}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>个人资料</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>年龄</Text>
                <TextInput
                  style={[styles.formInput, { 
                    borderColor: theme.border, 
                    color: theme.text,
                    backgroundColor: theme.inputBackground
                  }]}
                  value={age}
                  onChangeText={setAge}
                  placeholder="请输入年龄"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>性别</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      { 
                        borderColor: gender === '男' ? theme.primary : theme.border,
                        backgroundColor: gender === '男' ? theme.primary : theme.inputBackground
                      }
                    ]}
                    onPress={() => setGender('男')}
                  >
                    <Ionicons 
                      name="male" 
                      size={18} 
                      color={gender === '男' ? '#fff' : theme.primary} 
                    />
                    <Text 
                      style={[
                        styles.genderOptionText,
                        { color: gender === '男' ? '#fff' : theme.text }
                      ]}
                    >
                      男
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      { 
                        borderColor: gender === '女' ? '#F56C6C' : theme.border,
                        backgroundColor: gender === '女' ? '#F56C6C' : theme.inputBackground
                      }
                    ]}
                    onPress={() => setGender('女')}
                  >
                    <Ionicons 
                      name="female" 
                      size={18} 
                      color={gender === '女' ? '#fff' : '#F56C6C'} 
                    />
                    <Text 
                      style={[
                        styles.genderOptionText,
                        { color: gender === '女' ? '#fff' : theme.text }
                      ]}
                    >
                      女
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.genderOption, 
                      { 
                        borderColor: gender === '保密' ? '#909399' : theme.border,
                        backgroundColor: gender === '保密' ? '#909399' : theme.inputBackground
                      }
                    ]}
                    onPress={() => setGender('保密')}
                  >
                    <Ionicons 
                      name="lock-closed" 
                      size={18} 
                      color={gender === '保密' ? '#fff' : '#909399'} 
                    />
                    <Text 
                      style={[
                        styles.genderOptionText,
                        { color: gender === '保密' ? '#fff' : theme.text }
                      ]}
                    >
                      保密
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { borderTopColor: theme.divider }]}>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.buttonPrimary }]}
                onPress={saveUserProfile}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* 设置弹窗 */}
      <Modal
        transparent={true}
        visible={settingsModalVisible}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>设置</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={[styles.settingItem, { borderBottomColor: theme.divider }]}>
                <View style={styles.settingLabel}>
                  <Ionicons name="moon-outline" size={22} color={theme.primary} />
                  <Text style={[styles.settingText, { color: theme.text }]}>夜间模式</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#e1e1e1", true: "#81b0ff" }}
                  thumbColor={isDarkMode ? theme.primary : "#f4f3f4"}
                />
              </View>
              
              <View style={[styles.settingItem, { borderBottomColor: theme.divider }]}>
                <View style={styles.settingLabel}>
                  <Ionicons name="location-outline" size={22} color={theme.primary} />
                  <Text style={[styles.settingText, { color: theme.text }]}>显示IP属地</Text>
                </View>
                <Switch
                  value={showIPLocation}
                  onValueChange={setShowIPLocation}
                  trackColor={{ false: "#e1e1e1", true: "#81b0ff" }}
                  thumbColor={showIPLocation ? theme.primary : "#f4f3f4"}
                />
              </View>
              
              {showIPLocation && (
                <View style={[styles.settingItem, { borderBottomColor: theme.divider }]}>
                  <View style={styles.settingLabel}>
                    <Text style={[styles.settingValueText, { color: theme.text }]}>
                      当前IP属地: {ipLocation}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={loadIPLocation}
                  >
                    <Ionicons name="refresh" size={22} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            
            <View style={[styles.modalFooter, { borderTopColor: theme.divider }]}>
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.buttonPrimary }]}
                onPress={saveSettings}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {loading && !refreshing && !loadingMore ? (
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={theme.card}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      )}
      
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.buttonPrimary }]}
        onPress={handleCreate}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {showTopButton && (
        <TouchableOpacity
          style={[styles.topButton, { backgroundColor: `${theme.primary}CC` }]}
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
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 75 : 45,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  profileSection: {
    marginBottom: 25,
  },
  avatarContainer: {
    alignSelf: 'flex-start',
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#1DA1F2',
    marginTop: 10,
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#1DA1F2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '80%',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  genderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  maleBadge: {
    backgroundColor: '#1DA1F2',
  },
  femaleBadge: {
    backgroundColor: '#F56C6C',
  },
  ipLocationContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginLeft: 4,
  },
  ipLocationText: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 190 : 160,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  menuDivider: {
    height: 1, 
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 12,
    fontWeight: '500',
  },
  // 个人资料和设置弹窗样式
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2',
  },
  genderOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  // 其他已有样式
  filterContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#1DA1F2',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  travelItem: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: '#FFE58F',
  },
  approvedBadge: {
    backgroundColor: '#B7EB8F',
  },
  rejectedBadge: {
    backgroundColor: '#FFA39E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  rejectContainer: {
    flex: 1,
  },
  rejectReason: {
    marginTop: 4,
    fontSize: 12,
    color: '#FF3B30',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1DA1F2',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#aaa',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    marginTop: 20,
    backgroundColor: '#1DA1F2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  topButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
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
  refreshButton: {
    padding: 8,
  },
  settingValueText: {
    fontSize: 14,
    marginLeft: 12,
  },
});

export default MyTravelsScreen; 