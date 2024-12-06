const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/auth.config');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.header('X-Refresh-Token');
    
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      // 尝试验证 access token
      const decoded = jwt.verify(token, config.secret);
      const user = await User.findOne({
        where: {
          id: decoded.id,
          status: 'active'
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      req.token = token;
      req.user = user;
      next();
      
    } catch (tokenError) {
      // access token 验证失败,检查是否有 refresh token
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      try {
        // 验证 refresh token
        const decoded = jwt.verify(refreshToken, config.secret);
        const user = await User.findOne({
          where: {
            id: decoded.id,
            status: 'active'
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // 生成新的 token 对
        const newToken = jwt.sign(
          { id: user.id },
          config.secret,
          { expiresIn: config.jwtExpiration }
        );

        const newRefreshToken = jwt.sign(
          { id: user.id },
          config.secret,
          { expiresIn: config.jwtRefreshExpiration }
        );

        // 在响应头中返回新的 token
        res.set({
          'Access-Control-Expose-Headers': 'X-Access-Token, X-Refresh-Token',
          'X-Access-Token': newToken,
          'X-Refresh-Token': newRefreshToken
        });

        req.token = newToken;
        req.user = user;
        next();
      } catch (refreshError) {
        throw new Error('Invalid refresh token');
      }
    }
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: error.message || '请先登录'
    });
  }
};

// 角色验证中间件
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user.roles.some(userRole => roles.includes(userRole))) {
      return res.status(403).json({
        code: 403,
        message: '没有权限访问'
      });
    }
    next();
  };
};

module.exports = {
  auth,
  checkRole
}; 