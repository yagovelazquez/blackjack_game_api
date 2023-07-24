class ControllerUtils {
  static send_error_response({ res, message, status = 400 }) {
    return res.status(status).send({
      success: false,
      message,
    });
  }
}

module.exports = ControllerUtils;
