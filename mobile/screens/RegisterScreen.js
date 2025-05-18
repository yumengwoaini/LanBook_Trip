import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();

  // 选择头像
  const pickImage = async () => {
    try {
      // 请求媒体库权限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('提示', '需要访问相册权限才能选择头像');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('选择头像错误:', error);
      Alert.alert('提示', '选择头像失败，请重试');
    }
  };

  // 表单验证
  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert('注册失败', '请输入用户名');
      return false;
    }
    
    if (username.length < 3) {
      Alert.alert('注册失败', '用户名至少需要3个字符');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('注册失败', '请输入密码');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('注册失败', '密码至少需要6个字符');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('注册失败', '两次输入的密码不一致');
      return false;
    }
    
    if (!nickname.trim()) {
      Alert.alert('注册失败', '请输入昵称');
      return false;
    }
    
    return true;
  };

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 创建表单数据
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('nickname', nickname);
      
      // 添加头像（如果有）
      if (avatar) {
        const filename = avatar.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('avatar', {
          uri: avatar.uri,
          name: filename,
          type,
        });
      }
      
      const result = await register(formData);
      
      if (!result.success) {
        Alert.alert('注册失败', result.message || '注册失败，请重试');
      }
    } catch (error) {
      console.error('注册错误:', error);
      Alert.alert('注册失败', '请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>创建账号</Text>
          <Text style={styles.headerSubtitle}>加入蓝书，记录并分享您的旅行故事</Text>
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
            {avatar ? (
              <Image
                source={{ uri: avatar.uri }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>选择头像</Text>
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Text style={styles.avatarEditIconText}>+</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="用户名 (至少3个字符)"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="昵称"
            placeholderTextColor="#aaa"
            value={nickname}
            onChangeText={setNickname}
          />
          
          <TextInput
            style={styles.input}
            placeholder="密码 (至少6个字符)"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="确认密码"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[
              styles.button,
              (!username || !password || !confirmPassword || !nickname) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={isSubmitting || !username || !password || !confirmPassword || !nickname}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>注册</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>已有账号？</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>返回登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatarPlaceholderText: {
    color: '#aaa',
    fontSize: 14,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1DA1F2',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEditIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f8fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a0d0f7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#1DA1F2',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default RegisterScreen; 