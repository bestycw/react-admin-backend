const express = require('express');
const router = express.Router();
const { authJwt } = require('../middleware');
const userController = require('../controllers/user.controller');

// 添加日志中间件
const logMiddleware = (req, res, next) => {
  console.log('User route accessed:', req.path);
  console.log('Headers:', req.headers);
  next();
};

// 获取用户列表 (需要token验证)
router.get('/users', [logMiddleware, authJwt.verifyToken], userController.getUsers);

module.exports = router;