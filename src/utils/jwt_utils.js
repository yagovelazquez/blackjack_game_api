const jwt = require('jsonwebtoken');
const config = require('../config');

class JWTUtils {
  static generateaccess_token(payload, options = {}) {
    const { expiresIn = '1d' } = options;
    return jwt.sign(payload, config.jwtaccess_tokenSecret, { expiresIn });
  }

  static generaterefresh_token(payload) {
    return jwt.sign(payload, config.jwtrefresh_tokenSecret);
  }

  static verify_access_token(access_token) {
    return jwt.verify(access_token, config.jwtaccess_tokenSecret);
  }

  static verify_refresh_token(access_token) {
    return jwt.verify(access_token, config.jwtrefresh_tokenSecret);
  }
}

module.exports = JWTUtils;
