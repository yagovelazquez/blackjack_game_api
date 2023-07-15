const jwt = require('jsonwebtoken');
const config = require('../config');

class JWTUtils {
  static generateAccessToken(payload, options = {}) {
    const { expiresIn = '1d' } = options;
    return jwt.sign(payload, config.jwtAccessTokenSecret, { expiresIn });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwtRefreshTokenSecret);
  }

  static verifyAccessToken(accessToken) {
    return jwt.verify(accessToken, config.jwtAccessTokenSecret);
  }

  static verifyRefreshToken(accessToken) {
    return jwt.verify(accessToken, config.jwtRefreshTokenSecret);
  }
}

module.exports = JWTUtils;
