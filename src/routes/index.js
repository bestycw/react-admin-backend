const express = require('express');
const router = express.Router();
const testRoutes = require('./test.routes');
const uploadRoutes = require('./upload.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const dictRoutes = require('./dict.routes');

module.exports = (app) => {
  const io = app.get('io');

  // 认证相关路由
  router.use('/auth', authRoutes);
  
  // 用户相关路由
  router.use('/', userRoutes);
  
  // 角色相关路由
  router.use('/roles', roleRoutes);

  // 字典相关路由
  router.use('/dict', dictRoutes);
  
  // 文件上传相关路由
  router.use('/upload', uploadRoutes);

  // 测试相关路由
  router.use('/', testRoutes(io));

  return router;
}; 