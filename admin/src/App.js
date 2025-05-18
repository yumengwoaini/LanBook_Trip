import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// 组件导入
import AdminLayout from './components/Layout/AdminLayout';
import Login from './pages/Login/Login';
import ReviewList from './pages/Review/ReviewList';
import NotFound from './pages/NotFound/NotFound';

// 工具函数导入
import { isAuthenticated } from './utils/auth';

// 受保护的路由
const ProtectedRoute = ({ children }) => {
  const auth = isAuthenticated();
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
      console.log('未认证，重定向到登录页面');
    }
  }, [auth]);

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  const [theme] = useState({
    token: {
      colorPrimary: '#1DA1F2',
      borderRadius: 2,
    },
  });

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/review" replace />} />
          <Route path="review" element={<ReviewList />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
};

export default App;