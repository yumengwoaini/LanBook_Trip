const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// 保护路由，确保用户已登录
exports.protect = async (req, res, next) => {
  let token;

  // 从请求头或Cookie中获取token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 检查token是否存在
  if (!token) {
    console.log('未找到token');
    return res.status(401).json({
      success: false,
      message: '未授权，请登录'
    });
  }

  try {
    // 验证token
    console.log('开始验证token:', token);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log('token解码成功:', decoded);

    // 获取用户信息
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('用户不存在:', decoded.id);
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被删除'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    console.log('用户验证成功:', user.username);
    next();
  } catch (err) {
    console.error('Token验证错误:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      console.log('Token格式错误，收到的token:', token);
      return res.status(401).json({
        success: false,
        message: '无效的登录凭证，请重新登录'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '未授权，请重新登录'
    });
  }
};

// 授权角色访问
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('用户未定义');
      return res.status(401).json({
        success: false,
        message: '未授权，请登录'
      });
    }

    console.log('检查用户角色:', req.user.role, '允许的角色:', roles);
    if (!roles.includes(req.user.role)) {
      console.log('用户角色不匹配');
      return res.status(403).json({
        success: false,
        message: '无权访问此资源'
      });
    }

    console.log('角色验证通过');
    next();
  };
}; 