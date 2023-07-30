const request = require('supertest');

class ControllerHelper {
  constructor({ app, url, headers = [], data = {} } = {}) {
    this.app = app;
    this.url = url;
    this.headers = headers;
    this.data = data;
  }

  async request({ data = {}, expected_status = 200, method = 'post' } = {}) {
    return await request(this.app)
      [method](this.url)
      .set(...this.headers)
      .send({ ...this.data, ...data })
      .expect(expected_status);
  }
}

module.exports = ControllerHelper