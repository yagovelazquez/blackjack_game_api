require('../src/config');
const Database = require('../src/database');
const db_config = require('../src/config/database');
const request = require('supertest');
const { models } = require('../src/models');
const JWTUtils = require('../src/utils/jwt_utils');

let db;

class TestHelpers {
  static async start_db() {
    db = new Database('test', db_config);
    await db.connect();
    return db;
  }

  static async stop_db() {
    await db.disconnect();
  }

  static async sync_db() {
    await db.sync();
  }

  static generate_random_user(user_params = {}) {
    return {
      email: 'test@example.com',
      balance: 100.5,
      password: 'password123',
      username: 'testuser',
      name: 'John Doe',
      ...user_params,
    };
  }

  static async create_new_user(userParams = {}) {
    const { models } = require('../src/models');
    const fake_user = this.generate_random_user(userParams);
    const { User } = models;
    return User.create(fake_user);
  }

  static get_app() {
    const App = require('../src/app');
    return new App().getApp();
  }

  static mock_response = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  static mock_request = ({ data = {}, headers = {}, body = {} } = {}) => ({
    session: { data },
    headers,
    body,
  });
  
  static mock_error = (message) => new Error(message)

  static mock_next = () => jest.fn();

  static generate_token = (payload = { test: 'test' }) =>
    JWTUtils.generateAccessToken(payload);

  static async test_model_validation_error({ random_user_obj, error_message }) {
    const { User } = models;
    const fake_user = this.generate_random_user(random_user_obj);
    let err;
    let error_obj;

    try {
      await User.create(fake_user);
    } catch (error) {
      err = error;
      error_obj = error.errors[0];
    }

    expect(err).toBeDefined();
    expect(err.errors.length).toEqual(1);
    expect(error_obj.message).toEqual(error_message);
  }
}

module.exports = TestHelpers;
