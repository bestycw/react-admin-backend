const express = require('express');
const router = express.Router();
const { Dict, DictItem } = require('../models');
const { auth } = require('../middleware/auth.middleware');

// 获取字典列表
router.get('/dict', auth, async (req, res) => {
  try {
    const dicts = await Dict.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({
      code: 200,
      data: dicts
    });
  } catch (error) {
    console.error('Get dict list error:', error);
    res.status(500).json({
      code: 500,
      message: '获取字典列表失败'
    });
  }
});

// 获取字典项
router.get('/dict/items/:dictCode', auth, async (req, res) => {
  try {
    const { dictCode } = req.params;
    const items = await DictItem.findAll({
      where: { dictCode },
      order: [['itemSort', 'ASC']]
    });
    res.json({
      code: 200,
      data: items
    });
  } catch (error) {
    console.error('Get dict items error:', error);
    res.status(500).json({
      code: 500,
      message: '获取字典项失败'
    });
  }
});

// 创建字典
router.post('/dict', auth, async (req, res) => {
  try {
    const { code, name, status, remark } = req.body;

    // 检查字典编码是否已存在
    const existingDict = await Dict.findOne({ where: { code } });
    if (existingDict) {
      return res.status(400).json({
        code: 400,
        message: '字典编码已存在'
      });
    }

    const dict = await Dict.create({
      code,
      name,
      status,
      remark
    });

    res.json({
      code: 200,
      data: dict,
      message: '创建成功'
    });
  } catch (error) {
    console.error('Create dict error:', error);
    res.status(500).json({
      code: 500,
      message: '创建字典失败'
    });
  }
});

// 更新字典
router.put('/dict/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, status, remark } = req.body;

    const dict = await Dict.findByPk(id);
    if (!dict) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    // 如果修改了编码，检查新编码是否已存在
    if (code !== dict.code) {
      const existingDict = await Dict.findOne({ where: { code } });
      if (existingDict) {
        return res.status(400).json({
          code: 400,
          message: '字典编码已存在'
        });
      }
    }

    await dict.update({
      code,
      name,
      status,
      remark
    });

    res.json({
      code: 200,
      data: dict,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update dict error:', error);
    res.status(500).json({
      code: 500,
      message: '更新字典失败'
    });
  }
});

// 删除字典
router.delete('/dict/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dict = await Dict.findByPk(id);
    
    if (!dict) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    // 删除字典的同时删除相关的字典项
    await DictItem.destroy({
      where: { dictCode: dict.code }
    });

    await dict.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete dict error:', error);
    res.status(500).json({
      code: 500,
      message: '删除字典失败'
    });
  }
});

// 创建字典项
router.post('/dict/items', auth, async (req, res) => {
  try {
    const { dictCode, itemValue, itemLabel, itemSort, status, remark } = req.body;

    // 检查字典是否存在
    const dict = await Dict.findOne({ where: { code: dictCode } });
    if (!dict) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    const dictItem = await DictItem.create({
      dictCode,
      itemValue,
      itemLabel,
      itemSort: itemSort || 0,
      status,
      remark
    });

    res.json({
      code: 200,
      data: dictItem,
      message: '创建成功'
    });
  } catch (error) {
    console.error('Create dict item error:', error);
    res.status(500).json({
      code: 500,
      message: '创建字典项失败'
    });
  }
});

// 更新字典项
router.put('/dict/items/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { itemValue, itemLabel, itemSort, status, remark } = req.body;

    const dictItem = await DictItem.findByPk(id);
    if (!dictItem) {
      return res.status(404).json({
        code: 404,
        message: '字典项不存在'
      });
    }

    await dictItem.update({
      itemValue,
      itemLabel,
      itemSort,
      status,
      remark
    });

    res.json({
      code: 200,
      data: dictItem,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update dict item error:', error);
    res.status(500).json({
      code: 500,
      message: '更新字典项失败'
    });
  }
});

// 删除字典项
router.delete('/dict/items/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dictItem = await DictItem.findByPk(id);
    
    if (!dictItem) {
      return res.status(404).json({
        code: 404,
        message: '字典项不存在'
      });
    }

    await dictItem.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete dict item error:', error);
    res.status(500).json({
      code: 500,
      message: '删除字典项失败'
    });
  }
});

module.exports = router; 