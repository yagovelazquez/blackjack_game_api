const JWTUtils = require("../../src/utils/jwt_utils");
const jwt = require('jsonwebtoken');
const config = require("../../src/config");


describe('JWTUtils', () => {
  const mockPayload = { userId: 1 };

  describe('generateaccess_token', () => {
    it('should generate an access token', () => {
      const access_token = JWTUtils.generateaccess_token(mockPayload);
      expect(access_token).toBeDefined();
      expect(typeof access_token).toBe('string');
    });

    it('should generate an access token with custom expiration', () => {
      const options = { expiresIn: '2h' };
      const access_token = JWTUtils.generateaccess_token(mockPayload, options);
      const { exp, iat } = jwt.verify(access_token, config.jwtaccess_tokenSecret)
      const timeDiffInSeconds = exp - iat;
      const timeDiffInHours = Math.floor(timeDiffInSeconds / 3600);
      expect(timeDiffInHours).toBe(2)
      expect(access_token).toBeDefined();
      expect(typeof access_token).toBe('string');
    });
  });

  describe('generaterefresh_token', () => {
    it('should generate a refresh token', () => {
      const refresh_token = JWTUtils.generaterefresh_token(mockPayload);
      expect(refresh_token).toBeDefined();
      expect(typeof refresh_token).toBe('string');
    });
  });

  describe('verify_access_token', () => {
    it('should verify a valid access token', () => {
      const access_token = JWTUtils.generateaccess_token(mockPayload);
      const decodedToken = JWTUtils.verify_access_token(access_token);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.userId).toEqual(mockPayload.userId);
    });

    it('should throw an error for an invalid access token', () => {
      const invalidaccess_token = 'invalidaccess_token';
      expect(() => {
        JWTUtils.verify_access_token(invalidaccess_token);
      }).toThrow();
    });
  });

  describe('verify_refresh_token', () => {
    it('should verify a valid refresh token', () => {
      const refresh_token = JWTUtils.generaterefresh_token(mockPayload);
      const decodedToken = JWTUtils.verify_refresh_token(refresh_token);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.userId).toEqual(mockPayload.userId);
    });

    it('should throw an error for an invalid refresh token', () => {
      const invalidrefresh_token = 'invalidrefresh_token';
      expect(() => {
        JWTUtils.verify_refresh_token(invalidrefresh_token);
      }).toThrow();
    });
  });
});
