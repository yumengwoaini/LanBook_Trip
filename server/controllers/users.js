const User = require('../models/User');

// @desc    注册用户
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      password,
      nickname,
      avatar: req.file ? `avatars/${req.file.filename}` : 'default-avatar.png'
    });

    // 生成Token
    const token = user.getSignedToken();

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    用户登录
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查用户名和密码
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      });
    }

    // 查找用户
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成Token
    const token = user.getSignedToken();

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    获取当前用户信息
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    更新用户头像
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传头像'
      });
    }

    const avatarPath = `avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarPath },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('更新头像错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    更新用户昵称
// @route   PUT /api/users/nickname
// @access  Private
exports.updateNickname = async (req, res) => {
  try {
    const { nickname } = req.body;

    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: '请提供昵称'
      });
    }

    if (nickname.length > 30) {
      return res.status(400).json({
        success: false,
        message: '昵称不能超过30个字符'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { nickname },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      nickname: user.nickname
    });
  } catch (error) {
    console.error('更新昵称错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 