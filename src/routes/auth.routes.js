const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 检查用户状态
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
      { id: user._id, role: user.role },
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
    res.json({
      code: 200,
      data: req.user,
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
    const user = req.user;

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

module.exports = router; 