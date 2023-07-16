const JWTUtils = require("../utils/jwt_utils");


function auth(token_type = 'access_token') {
  return function (req, res, next) {
    const auth_header = req.headers.authorization;
    if (auth_header) {
      try {
        var [bearer, token] = auth_header.split(' ');
        if (bearer.toLowerCase() !== 'bearer' || !token) {
          throw Error;
        }
      } catch (err) {
        return res
          .status(401)
          .send({ success: false, message: 'Bearer token malformed' });
      }
    } else {
      return res
        .status(401)
        .send({ success: false, message: 'Authorization header not found' });
    }

    try {
      let jwt;
      switch (token_type) {
        case 'refresh_token':
          jwt = JWTUtils.verifyRefreshToken(token);
          break;
        case 'access_token':
          jwt = JWTUtils.verifyAccessToken(token);
          break;
      }
      req.body.jwt = jwt;
      next();
    } catch (err) {
      return res.status(401).send({ success: false, message: 'Invalid token' });
    }
  };
}

module.exports = auth;