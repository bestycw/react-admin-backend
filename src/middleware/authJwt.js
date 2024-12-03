const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({
      code: 403,
      message: '未提供令牌！'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '令牌已过期'
      });
    }
    return res.status(401).json({
      code: 401,
      message: '无效的令牌'
    });
  }
};

module.exports = {
  verifyToken
}; 