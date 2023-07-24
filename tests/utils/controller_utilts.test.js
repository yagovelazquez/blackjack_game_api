const ControllerUtils = require('../../src/utils/controller_utils')


const mock_res = {
  status: jest.fn(() => mock_res),
  send: jest.fn(),
};

describe('ControllerUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send error response with default status', () => {
    const message = 'Error message';
    const expected_response = {
      success: false,
      message,
    };

    ControllerUtils.send_error_response({res: mock_res, message});

    expect(mock_res.status).toHaveBeenCalledTimes(1);
    expect(mock_res.status).toHaveBeenCalledWith(400);
    expect(mock_res.send).toHaveBeenCalledTimes(1);
    expect(mock_res.send).toHaveBeenCalledWith(expected_response);
  });

  it('should send error response with custom status', () => {
    const message = 'Error message';
    const customStatus = 404;
    const expected_response = {
      success: false,
      message,
    };

    ControllerUtils.send_error_response({res: mock_res, message, status: customStatus});

    expect(mock_res.status).toHaveBeenCalledTimes(1);
    expect(mock_res.status).toHaveBeenCalledWith(customStatus);
    expect(mock_res.send).toHaveBeenCalledTimes(1);
    expect(mock_res.send).toHaveBeenCalledWith(expected_response);
  });
});
