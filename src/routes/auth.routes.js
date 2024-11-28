const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authController = require('../controllers/auth.controller');

// ... 其他路由

// 注册相关路由
router.post('/register', authController.register);
router.post('/send-code', authController.sendVerificationCode);
// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    // 查找用户 - 支持用户名或手机号登录
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username },
          { mobile: username }
        ]
      } 
    });

    console.log('Found user:', user ? {
      id: user.id,
      username: user.username,
      mobile: user.mobile,
      status: user.status
    } : 'No user found');

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 检查用户状态
    console.log('User status:', user.status);

    if (user.status !== 'active') {
      return res.status(401).json({
        code: 401,
        message: '账号已被禁用'
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成 token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      data: {
        token,
        user: user.toJSON()
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

// 退出登录
router.post('/logout', auth, async (req, res) => {
  try {
    // 这里可以添加token黑名单等逻辑
    res.json({
      code: 200,
      message: '退出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 200,
      data: user.toJSON(),
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

// 修改密码
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    // 验证旧密码
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: '原密码错误'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

// 重置密码
router.post('/reset-password', authController.resetPassword);

module.exports = router; 