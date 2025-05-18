const mongoose = require('mongoose');

const TravelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '请提供游记标题'],
      trim: true,
      maxlength: [100, '标题不能超过100个字符']
    },
    content: {
      type: String,
      required: [true, '请提供游记内容'],
      trim: true
    },
    images: {
      type: [String],
      required: [true, '请至少上传一张图片']
    },
    video: {
      type: String,
      default: ''
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectReason: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 虚拟属性，获取作者信息
TravelSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true
});

// 查询中间件，排除已删除的游记
TravelSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Travel', TravelSchema); 