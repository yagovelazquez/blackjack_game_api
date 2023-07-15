require('../src/config');
const Database = require('../src/database');
const db_config = require('../src/config/database');
const request = require('supertest');
const { models } = require('../src/models');

let db;

class TestHelpers {
  static async startDb() {
    db = new Database('test', db_config);
    await db.connect();
    return db;
  }

  static async stopDb() {
    await db.disconnect();
  }

  static async syncDb() {
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

  static async createNewUser(userParams = {}) {
    const { models } = require('../src/models');
    const fake_user = this.generate_random_user(userParams);
    const { User } = models;
    return User.create(fake_user);
  }

  static getApp() {
    const App = require('../src/app');
    return new App().getApp();
  }

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
