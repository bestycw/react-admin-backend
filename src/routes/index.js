const express = require('express');
const router = express.Router();
const testRoutes = require('./test.routes');
const uploadRoutes = require('./upload.routes');

module.exports = (app) => {
  const io = app.get('io');
  
  // 注册测试路由，移除 /test 前缀
  router.use('/', testRoutes(io));
  
  // 注册上传路由
  router.use('/upload', uploadRoutes);

  return router;
}; 