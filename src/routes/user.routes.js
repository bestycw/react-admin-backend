const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const { User } = require('../models');
const { Op } = require('sequelize');

// 获取用户列表 - 移除 checkRole，只保留基本认证
router.get('/users', auth, async (req, res) => {
  try {
    const { current = 1, pageSize = 10, username, email, status, role } = req.query;
    
    const where = {};
    if (username) where.username = { [Op.iLike]: `%${username}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (status) where.status = status;
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(current) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      code: 200,
      data: {
        list: rows,
        total: count,
        current: parseInt(current),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 更新用户
router.put('/users/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, roles, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    await user.update({
      username,
      email,
      roles,
      status
    });

    res.json({
      code: 200,
      data: {
        ...user.toJSON(),
        password: undefined
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户失败',
      error: error.message
    });
  }
});

// 删除用户
router.delete('/users/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    await user.destroy();
    res.json({
      code: 200,
      data: null,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除用户失败',
      error: error.message
    });
  }
});

// 重置密码
router.post('/users/:id/reset-password', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 重置为默认密码 123456
    await user.update({ password: '123456' });

    res.json({
      code: 200,
      data: null,
      message: '密码重置成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '重置密码失败',
      error: error.message
    });
  }
});

// 创建用户
router.post('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { username, password, email, roles, status } = req.body;
    console.log('Creating user with roles:', req.user.roles);

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 创建用户，使用默认密码
    const user = await User.create({
      username,
      password: password || '123456',
      email: email || null,
      roles,
      status: status || 'active'
    });

    res.json({
      code: 200,
      data: {
        ...user.toJSON(),
        password: undefined
      },
      message: '创建成功'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      code: 500,
      message: '创建用户失败',
      error: error.message
    });
  }
});

module.exports = router;