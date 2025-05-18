// @desc    上传图片
// @route   POST /api/upload/images
// @access  Private
exports.uploadImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    // 处理图片路径
    const images = req.files.map(file => ({
      filename: file.filename,
      path: `images/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size
    }));

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    上传视频
// @route   POST /api/upload/video
// @access  Private
exports.uploadVideo = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的视频'
      });
    }

    // 处理视频信息
    const video = {
      filename: req.file.filename,
      path: `videos/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    return res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('上传视频错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// @desc    上传头像
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的头像'
      });
    }

    // 处理头像信息
    const avatar = {
      filename: req.file.filename,
      path: `avatars/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    return res.status(200).json({
      success: true,
      data: avatar
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 