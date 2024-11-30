const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader);

  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token:', token);

  if (!token) {
    return res.status(403).json({
      success: false,
      message: '未提供令牌！'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err, 'Secret used:', config.secret);
      return res.status(401).json({
        success: false,
        message: '未授权！'
      });
    }
    console.log('Decoded token:', decoded);
    req.userId = decoded.id;
    next();
  });
};

module.exports = {
  verifyToken
}; 