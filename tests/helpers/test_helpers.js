require('../../src/config');
const Database = require('../../src/database');
const db_config = require('../../src/config/database');
const request = require('supertest');
const { models } = require('../../src/models');
const JWTUtils = require('../../src/utils/jwt_utils');
const enums = require('../../src/enum');
const faker = require('faker');

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
      email: faker.internet.email(),
      balance: 100.5,
      password: 'password123',
      username: faker.internet.userName(),
      name: 'John Doe',
      ...user_params,
    };
  }

  static async create_new_user(userParams = {}) {
    const { models } = require('../../src/models');
    const fake_user = this.generate_random_user(userParams);
    const { User } = models;
    return User.create(fake_user);
  }

  static get_app() {
    const App = require('../../src/app');
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

  static mock_error = (message) => new Error(message);

  static mock_next = () => jest.fn();

  static generate_random_game = async (game_params = {}) => {
    const user = await this.create_new_user();
    return {
      user_id: user.id,
      status: enums.game_status.IN_PROGRESS,
      house_balance_fluctuation: 100.2,
      ...game_params,
    };
  };

  static generate_token = (payload = { test: 'test' }) =>
    JWTUtils.generateAccessToken(payload);

  static async test_user_model_validation_error({
    random_user_obj,
    error_message,
  }) {
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

  static async create_and_find_in_db(model, data) {
    const { [model]: Model } = models;
    const created_instance = await Model.create(data);
    const stored_db_instance = await Model.findByPk(created_instance.id);
    return { created_instance, stored_db_instance };
  }
}

module.exports = TestHelpers;
