import React from 'react';
import { StyleSheet } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

// 主应用内容组件，可以使用主题上下文
const MainApp = () => {
  const { theme } = useTheme();
  
  return (
    <AppNavigator />
  );
};

// 应用主组件
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 