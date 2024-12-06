module.exports = {
  secret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiration: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRE) || 7200,
  jwtRefreshExpiration: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRE) || 604800,
}; 