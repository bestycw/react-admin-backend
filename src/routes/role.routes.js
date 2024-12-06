const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const { Role } = require('../models');
const { Op } = require('sequelize');
const { authJwt } = require('../middleware');

// 获取角色列表
router.get('/roles', auth, async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      code: 200,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取角色列表失败',
      error: error.message
    });
  }
});

// 创建角色
router.post('/roles', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { name, code, description, status, permissions } = req.body;

    // 验证必填字段
    if (!name || !code) {
      return res.status(400).json({
        code: 400,
        message: '名称和编码不能为空'
      });
    }

    // 检查角色编码是否已存在
    const existingRole = await Role.findOne({ where: { code } });
    if (existingRole) {
      return res.status(400).json({
        code: 400,
        message: '角色编码已存在'
      });
    }

    const role = await Role.create({
      name,
      code,
      description,
      status: status || 'active',
      permissions: permissions || []
    });

    res.json({
      code: 200,
      data: role,
      message: '创建成功'
    });
  } catch (error) {
    console.error('Create role error:', error);  // 添加错误日志
    res.status(500).json({
      code: 500,
      message: '创建角色失败',
      error: error.message
    });
  }
});

// 更新角色
router.put('/roles/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, status, permissions,dynamicRoutesList} = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    // 如果修改了编码，检查新编码是否已存在
    if (code !== role.code) {
      const existingRole = await Role.findOne({ where: { code } });
      if (existingRole) {
        return res.status(400).json({
          code: 400,
          message: '角色编码已存在'
        });
      }
    }

    await role.update({
      name,
      code,
      description,
      status,
      permissions,
      dynamicRoutesList
    });

    res.json({
      code: 200,
      data: role,
      message: '更新成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新角色失败',
      error: error.message
    });
  }
});

// 删除角色
router.delete('/roles/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    await role.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除角色失败',
      error: error.message
    });
  }
});

// 获取角色的动态路由
router.get('/api/roles/routes/:roleCodes', [authJwt.verifyToken], async (req, res) => {
  try {
    const roleCodes = req.params.roleCodes.split(',');
    
    // 查找所有指定的角色
    const roles = await Role.findAll({
      where: {
        code: {
          [Op.in]: roleCodes
        }
      }
    });

    if (!roles.length) {
      return res.status(404).json({
        code: 404,
        message: '未找到指定角色'
      });
    }

    // 合并所有角色的动态路由，并去重
    const dynamicRoutesList = new Set();
    
    for (const role of roles) {
      // 如果有管理员角色且拥有 * 权限，直接返回 ['*']
      if (role.code === 'admin' && role.permissions?.includes('/')) {
        return res.json({
          code: 200,
          data: ['/'],
          message: '获取成功'
        });
      }
      
      // 合并其他角色的路由
      role.dynamicRoutesList?.forEach(route => dynamicRoutesList.add(route));
    }

    res.json({
      code: 200,
      data: Array.from(dynamicRoutesList),
      message: '获取成功'
    });
  } catch (error) {
    console.error('Get role routes error:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
});

module.exports = router; 