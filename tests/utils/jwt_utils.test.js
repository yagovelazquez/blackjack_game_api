const JWTUtils = require("../../src/utils/jwt_utils");
const jwt = require('jsonwebtoken');
const config = require("../../src/config");


describe('JWTUtils', () => {
  const mockPayload = { userId: 1 };

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const accessToken = JWTUtils.generateAccessToken(mockPayload);
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
    });

    it('should generate an access token with custom expiration', () => {
      const options = { expiresIn: '2h' };
      const accessToken = JWTUtils.generateAccessToken(mockPayload, options);
      const { exp, iat } = jwt.verify(accessToken, config.jwtAccessTokenSecret)
      const timeDiffInSeconds = exp - iat;
      const timeDiffInHours = Math.floor(timeDiffInSeconds / 3600);
      expect(timeDiffInHours).toBe(2)
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const refreshToken = JWTUtils.generateRefreshToken(mockPayload);
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const accessToken = JWTUtils.generateAccessToken(mockPayload);
      const decodedToken = JWTUtils.verifyAccessToken(accessToken);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.userId).toEqual(mockPayload.userId);
    });

    it('should throw an error for an invalid access token', () => {
      const invalidAccessToken = 'invalidAccessToken';
      expect(() => {
        JWTUtils.verifyAccessToken(invalidAccessToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const refreshToken = JWTUtils.generateRefreshToken(mockPayload);
      const decodedToken = JWTUtils.verifyRefreshToken(refreshToken);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.userId).toEqual(mockPayload.userId);
    });

    it('should throw an error for an invalid refresh token', () => {
      const invalidRefreshToken = 'invalidRefreshToken';
      expect(() => {
        JWTUtils.verifyRefreshToken(invalidRefreshToken);
      }).toThrow();
    });
  });
});
