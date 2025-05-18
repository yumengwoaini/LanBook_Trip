import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载保存的主题设置
  useEffect(() => {
    loadThemeSettings();
  }, []);

  // 从存储中加载主题设置
  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // 如果没有保存过设置，则使用设备默认主题
        setIsDarkMode(deviceTheme === 'dark');
      }
    } catch (error) {
      console.error('加载主题设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换主题模式
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('theme_mode', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  };

  // 主题颜色
  const theme = {
    // 基础颜色
    primary: isDarkMode ? '#1DA1F2' : '#1DA1F2',
    background: isDarkMode ? '#121212' : '#FFFFFF',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    border: isDarkMode ? '#2A2A2A' : '#E1E8ED',
    notification: isDarkMode ? '#FF3B30' : '#FF3B30',
    
    // 特定元素颜色
    headerBackground: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    tabBarBackground: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    inputBackground: isDarkMode ? '#2A2A2A' : '#F0F5F9',
    placeholder: isDarkMode ? '#888888' : '#657786',
    subtitle: isDarkMode ? '#AAAAAA' : '#666666',
    icon: isDarkMode ? '#CCCCCC' : '#657786',
    divider: isDarkMode ? '#2A2A2A' : '#E1E8ED',
    statusBar: isDarkMode ? 'light-content' : 'dark-content',
    
    // 按钮颜色
    buttonPrimary: isDarkMode ? '#1DA1F2' : '#1DA1F2',
    buttonText: isDarkMode ? '#FFFFFF' : '#FFFFFF',
    buttonDisabled: isDarkMode ? '#444444' : '#CCCCCC',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 