const db = require('../models');
const { User } = db;
const { Op } = db.Sequelize;
const { sendVerificationCode, verifyCode } = require('../services/sms.service');
const avatarService = require('../services/avatar.service');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

exports.register = async (req, res) => {
  try {
    const { username, password, mobile, verificationCode } = req.body;

    // 验证验证码
    if (!verifyCode(mobile, verificationCode, 'register')) {
      return res.status(400).json({ 
        code: 400,
        message: '验证码错误或已过期' 
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username },
          { mobile }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        code: 400,
        message: '用户名或手机号已被注册' 
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      mobile,
      roles: ['user'],
      permissions: [],
      dynamicRoutesList: []
    });

    res.status(200).json({ 
      code: 200,
      message: '注册成功' 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      code: 500,
      message: '注册失败，请稍后重试' 
    });
  }
};

exports.sendVerificationCode = async (req, res) => {
  try {
    const { mobile, type } = req.body;
    const result = await sendVerificationCode(mobile, type);
    res.json({
      code: 200,
      data: {
        verifyCode: result.code
      },
      message: result.message
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ 
      code: 500,
      message: '发送验证码失败' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { mobile, verificationCode, newPassword } = req.body;
    console.log('Reset password request:', { mobile, verificationCode });

    // 验证验证码
    if (!verifyCode(mobile, verificationCode, 'reset')) {
      console.log('Verification code invalid or expired');
      return res.status(400).json({ 
        code: 400,
        message: '验证码错误或已过期' 
      });
    }

    // 查找用户
    const user = await User.findOne({ 
      where: { mobile } 
    });

    if (!user) {
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在' 
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ 
      code: 200,
      message: '密码重置成功' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      code: 500,
      message: '密码重置失败，请稍后重试' 
    });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: 'No file uploaded'
      });
    }

    // 处理头像
    const avatarUrl = await avatarService.processAvatar(req.file);

    // 获取用户
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      });
    }

    // 删除旧头像
    if (user.avatar) {
      await avatarService.deleteOldAvatar(user.avatar);
    }

    // 更新用户头像
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      code: 200,
      data: {
        url: avatarUrl
      },
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      code: 500,
      message: 'Failed to upload avatar'
    });
  }
};

exports.login = async (req, res) => {
  try {
    // ... 验证用户名密码逻辑 ...

    const token = jwt.sign(
      { id: user.id },
      config.secret,
      { expiresIn: config.jwtExpiration }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          // ... 用户信息
        }
      }
    });
  } catch (error) {
    // ... 错误处理
  }
}; 