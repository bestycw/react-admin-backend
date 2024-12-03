const jwt = require('jsonwebtoken');
const { User } = require('../models');

 const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({
      where: {
        id: decoded.id,
        status: 'active'
      }
    });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: '请先登录'
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