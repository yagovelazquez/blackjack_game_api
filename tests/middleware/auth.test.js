const auth = require('../../src/middleware/auth');
const TestHelpers = require('../helpers/test_helpers')

const JWTUtils = require('../../src/utils/jwt_utils');

describe('Auth Middleware', () => {
  let mock_request;
  let mock_response;
  let mock_next;
  let valid_token;
  let mock_valid_request;

  beforeEach(() => {
    valid_token = TestHelpers.generate_token();
    mock_response = TestHelpers.mock_response();
    mock_next = TestHelpers.mock_next();
    mock_valid_request = TestHelpers.mock_request({
      headers: {
        authorization: `Bearer ${valid_token}`,
      },
    });
  });

  it('should set jwt payload in req.body when token is valid', () => {
    auth('access_token')(mock_valid_request, mock_response, mock_next);
    expect(mock_valid_request.body.jwt).toHaveProperty('test', 'test');
    expect(mock_next).toBeCalled();
  });

  it('should return authorization not found if not authorization header', () => {
    mock_request = TestHelpers.mock_request();
    auth('access_token')(mock_request, mock_response);
    expect(mock_response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Authorization header not found',
    });
    expect(mock_response.status).toHaveBeenCalledWith(401);
  });

  it('should thrown an error if "bearer" could not get destructured from authorization header', () => {
    mock_request = TestHelpers.mock_request({
      headers: {
        authorization: `notBearer ${valid_token}`,
      },
    });

    auth('access_token')(mock_request, mock_response);
    expect(mock_response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Bearer token malformed',
    });
    expect(mock_response.status).toHaveBeenCalledWith(401);
  });

  it('should thrown an error if token has no value', () => {
    mock_request = TestHelpers.mock_request({
      headers: {
        authorization: `Bearer`,
      },
    });

    auth('access_token')(mock_request, mock_response);
    expect(mock_response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Bearer token malformed',
    });
    expect(mock_response.status).toHaveBeenCalledWith(401);
  });

  it('should call jwtutils.verifyrefreshtoken if refresh_token is passed as argument to auth', () => {
    const spy = jest.spyOn(JWTUtils, 'verifyRefreshToken');

    auth('refresh_token')(mock_valid_request, mock_response, mock_next);
    expect(spy).toBeCalled();
  });

  it('should call jwtutils.verifyAccessToken if access_token is passed as argument to auth', () => {
    const spy = jest.spyOn(JWTUtils, 'verifyAccessToken');
    auth('access_token')(mock_valid_request, mock_response, mock_next);
    expect(spy).toBeCalled();
  });

  it('should return invalid token if token is not valid', () => {
    mock_request = TestHelpers.mock_request({
      headers: {
        authorization: `Bearer not_valid_token`,
      },
    });

    auth('access_token')(mock_request, mock_response, mock_next);
    expect(mock_response.send).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token',
    });
  });
});
