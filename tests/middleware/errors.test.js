const auth = require('../../src/middleware/auth');
const TestHelpers = require('../test_helpers');
const JWTUtils = require('../../src/utils/jwt_utils');
const errors = require('../../src/middleware/errors');

describe('Errors Middleware', () => {
  let mock_request;
  let mock_response;
  let mock_next;
  let valid_token;
  let mock_valid_request;

  beforeEach(() => {
    valid_token = TestHelpers.generate_token();
    mock_response = TestHelpers.mock_response();
    mock_next = TestHelpers.mock_next();
    mock_valid_request = TestHelpers.mock_request();
  });
  it('should return the error and status 500 if an there is an untreated error', () => {
    const error_message = 'Test error';
    const mock_error = TestHelpers.mock_error(error_message);
    errors(mock_error, mock_valid_request, mock_response, mock_next);
    expect(mock_response.status).toBeCalledWith(500);
    expect(mock_response.send).toBeCalledWith({
      success: false,
      message: error_message,
    });
  });
});
