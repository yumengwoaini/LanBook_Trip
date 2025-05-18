const Travel = require('../models/Travel');
const User = require('../models/User');

// @desc    创建游记
// @route   POST /api/travels
// @access  Private
exports.createTravel = async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // 检查必要字段
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '请提供游记标题和内容'
      });
    }
    
    // 检查图片
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少上传一张图片'
      });
    }
    
    // 处理图片路径
    const images = req.files.images.map(file => `images/${file.filename}`);
    
    // 处理视频路径（如果有）
    const video = req.files.video && req.files.video[0] 
      ? `videos/${req.files.video[0].filename}` 
      : '';
    
    // 创建游记
    const travel = await Travel.create({
      title,
      content,
      images,
      video,
      author: req.user.id
    });
    
    return res.status(201).json({
      success: true,
      data: travel
    });
  } catch (error) {
    console.error('创建游记错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    获取所有游记（已通过审核）
// @route   GET /api/travels
// @access  Public
exports.getTravels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    
    // 构建查询条件
    const query = {
      status: 'approved'
    };
    
    // 如果有关键词，添加搜索条件
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } }
      ];
      
      // 也搜索作者昵称
      const users = await User.find({
        nickname: { $regex: keyword, $options: 'i' }
      });
      
      if (users.length > 0) {
        const userIds = users.map(user => user._id);
        query.$or.push({ author: { $in: userIds } });
      }
    }
    
    // 获取游记总数
    const total = await Travel.countDocuments(query);
    
    // 获取游记列表
    const travels = await Travel.find(query)
      .populate('author', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return res.status(200).json({
      success: true,
      count: travels.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: travels
    });
  } catch (error) {
    console.error('获取游记列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    获取单个游记
// @route   GET /api/travels/:id
// @access  Public
exports.getTravel = async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id)
      .populate('author', 'nickname avatar');
    
    if (!travel) {
      return res.status(404).json({
        success: false,
        message: '游记不存在'
      });
    }
    
    // 非管理员/审核人员只能查看已通过的游记
    // 或者如果游记未通过审核，则必须是作者本人
    if (
      travel.status !== 'approved' && 
      ( 
        !req.user || 
        ( 
          req.user.role !== 'admin' && 
          req.user.role !== 'reviewer' && 
          travel.author._id.toString() !== req.user.id 
        )
      )
    ) {
      // ---- 调试日志开始 ----
      console.log('权限校验失败前的调试信息:');
      console.log('游记状态:', travel.status);
      console.log('当前用户ID:', req.user ? req.user.id : '用户未定义');
      console.log('游记作者ID:', travel.author ? travel.author._id.toString() : '作者未定义');
      console.log('当前用户是否为作者:', travel.author && req.user ? (travel.author._id.toString() === req.user.id) : '无法比较作者');
      console.log('用户角色:', req.user ? req.user.role : '角色未定义');
      // ---- 调试日志结束 ----
      return res.status(403).json({
        success: false,
        message: '无权访问此游记' 
      });
    }
    
    return res.status(200).json({
      success: true,
      data: travel
    });
  } catch (error) {
    console.error('获取游记详情错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    更新游记
// @route   PUT /api/travels/:id
// @access  Private
exports.updateTravel = async (req, res) => {
  try {
    let travel = await Travel.findById(req.params.id);
    
    if (!travel) {
      return res.status(404).json({
        success: false,
        message: '游记不存在'
      });
    }
    
    // 检查权限（只有作者可以更新）
    if (travel.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新此游记'
      });
    }
    
    // 只有待审核或被拒绝的游记可以更新
    if (travel.status !== 'pending' && travel.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: '已通过审核的游记不可更新'
      });
    }
    
    const { title, content } = req.body;
    const updateData = { title, content };
    
    // 如果有新图片，更新图片
    if (req.files && req.files.images && req.files.images.length > 0) {
      updateData.images = req.files.images.map(file => `images/${file.filename}`);
    }
    
    // 如果有新视频，更新视频
    if (req.files && req.files.video && req.files.video[0]) {
      updateData.video = `videos/${req.files.video[0].filename}`;
    }
    
    // 更新状态为待审核
    updateData.status = 'pending';
    updateData.rejectReason = '';
    
    // 更新游记
    travel = await Travel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      data: travel
    });
  } catch (error) {
    console.error('更新游记错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    删除游记
// @route   DELETE /api/travels/:id
// @access  Private
exports.deleteTravel = async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id);
    
    if (!travel) {
      return res.status(404).json({
        success: false,
        message: '游记不存在'
      });
    }
    
    // 检查权限（作者或管理员可以删除）
    if (travel.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此游记'
      });
    }
    
    // 执行删除操作
    if (req.user.role === 'admin') {
      // 管理员执行逻辑删除
      await Travel.findByIdAndUpdate(req.params.id, { isDeleted: true });
    } else {
      // 作者执行物理删除
      await Travel.findByIdAndDelete(req.params.id);
    }
    
    return res.status(200).json({
      success: true,
      message: '游记已删除'
    });
  } catch (error) {
    console.error('删除游记错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    获取当前用户的游记
// @route   GET /api/travels/my
// @access  Private
exports.getMyTravels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Travel.countDocuments({ author: req.user.id });
    
    const travels = await Travel.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return res.status(200).json({
      success: true,
      count: travels.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: travels
    });
  } catch (error) {
    console.error('获取我的游记错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    审核游记列表（包括待审核、已通过、已拒绝）
// @route   GET /api/travels/admin/all
// @access  Private (Admin, Reviewer)
exports.getAdminTravels = async (req, res) => {
  try {
    console.log('开始获取管理员游记列表');
    console.log('用户角色:', req.user.role);
    console.log('用户ID:', req.user.id);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    
    // 构建查询条件
    const query = { isDeleted: { $ne: true } };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    console.log('查询条件:', query);
    
    // 获取游记总数
    const total = await Travel.countDocuments(query);
    console.log('游记总数:', total);
    
    // 获取游记列表
    const travels = await Travel.find(query)
      .populate('author', 'nickname avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('获取到的游记数量:', travels.length);
    
    return res.status(200).json({
      success: true,
      count: travels.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: travels
    });
  } catch (error) {
    console.error('获取审核游记列表错误:', error);
    return res.status(500).json({
      success: false,
      message: '获取游记列表失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    审核游记
// @route   PUT /api/travels/:id/review
// @access  Private (Admin, Reviewer)
exports.reviewTravel = async (req, res) => {
  try {
    const { status, rejectReason } = req.body;
    
    // 检查状态有效性
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      });
    }
    
    // 如果拒绝，必须提供拒绝原因
    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({
        success: false,
        message: '请提供拒绝原因'
      });
    }
    
    // 更新游记
    const updateData = {
      status,
      reviewedBy: req.user.id,
      reviewedAt: Date.now()
    };
    
    if (status === 'rejected') {
      updateData.rejectReason = rejectReason;
    }
    
    const travel = await Travel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'nickname avatar');
    
    if (!travel) {
      return res.status(404).json({
        success: false,
        message: '游记不存在'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: travel
    });
  } catch (error) {
    console.error('审核游记错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 