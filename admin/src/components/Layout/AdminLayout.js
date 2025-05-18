import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Button, Avatar, message } from 'antd';
import { 
  MenuUnfoldOutlined, 
  MenuFoldOutlined, 
  UserOutlined, 
  LogoutOutlined,
  AuditOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout, isAdmin } from '../../utils/auth';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogout = () => {
    logout();
    message.success('退出登录成功');
    navigate('/login');
  };
  
  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );
  
  // 根据路径获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/review')) return ['review'];
    return ['dashboard'];
  };
  
  return (
    <Layout className="admin-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} width={220}>
        <div className="logo">
          <h1>{collapsed ? '蓝' : '蓝书管理系统'}</h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: '控制台',
              onClick: () => navigate('/'),
            },
            {
              key: 'review',
              icon: <AuditOutlined />,
              label: '游记审核',
              onClick: () => navigate('/review'),
            }
          ]}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="toggle-button"
          />
          <div className="header-right">
            <Dropdown overlay={userMenu} placement="bottomRight" arrow>
              <div className="user-info">
                <Avatar icon={<UserOutlined />} size="small" />
                <span className="username">{user?.username}</span>
                <span className="role-badge">{user?.role === 'admin' ? '管理员' : '审核员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 