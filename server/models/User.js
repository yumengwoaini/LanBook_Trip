const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '请提供用户名'],
      unique: true,
      trim: true,
      minlength: [3, '用户名至少需要3个字符'],
      maxlength: [20, '用户名不能超过20个字符']
    },
    password: {
      type: String,
      required: [true, '请提供密码'],
      minlength: [6, '密码至少需要6个字符'],
      select: false
    },
    nickname: {
      type: String,
      required: [true, '请提供昵称'],
      trim: true,
      maxlength: [30, '昵称不能超过30个字符']
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    role: {
      type: String,
      enum: ['user', 'reviewer', 'admin'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

// 加密密码
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 校验密码
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 生成JWT
UserSchema.methods.getSignedToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', UserSchema); 