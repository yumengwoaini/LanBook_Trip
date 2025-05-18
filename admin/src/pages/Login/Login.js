import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as loginApi } from '../../api/auth';
import { login as setLoginState } from '../../utils/auth';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      // 调用真实的登录 API
      const response = await loginApi({
        username: values.username,
        password: values.password
      });
      
      if (response.success) {
        // 设置登录状态
        setLoginState(response.token, response.user);
        
        message.success('登录成功');
        // 添加延迟，确保状态更新完成
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error(error.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <h1>蓝书管理系统</h1>
          <p>游记审核与内容管理平台</p>
        </div>
        <Card className="login-card">
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;