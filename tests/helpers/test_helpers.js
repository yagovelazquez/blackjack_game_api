require('../../src/config');
const Database = require('../../src/database');
const db_config = require('../../src/config/database');
const request = require('supertest');
const { models } = require('../../src/models');
const JWTUtils = require('../../src/utils/jwt_utils');
const enums = require('../../src/enum');
const faker = require('faker');
const _ = require('lodash');

let db;

class TestHelpers {
  static async start_db() {
    db = new Database('test', db_config);
    await db.connect();
    return db;
  }

  static async seed_database({ model_name, seed_data }) {
    await db.seed_database({ model_name, seed_data });
  }

  static async stop_db() {
    await db.disconnect();
  }

  static async sync_db() {
    await db.sync();
  }

  static async generate_random_deck(deck_params = {}) {
    const { Card, Game } = models;
    const random_game_data = await TestHelpers.generate_random_game();
    const random_game = await Game.create(random_game_data);
    const all_db_cards = await Card.findAll({ raw: true, attributes: ['id'] });
    const cards = _.times(4, () => all_db_cards)[0];
    return { cards, game_id: random_game.id, ...deck_params };
  }

  static async generate_random_card(card_params = {}) {
    const { Card } = models;
    const id = await Card.generate_id(
      card_params.rank || enums.card_rank[1],
      card_params.suit || enums.card_suit.CLUBS
    );
    return {
      id: id,
      rank: enums.card_rank[1],
      value: enums.card_values.one,
      suit: enums.card_suit.CLUBS,
      second_value: enums.card_values.eleven,
      ...card_params,
    };
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

  static async create_user_and_get_token(app) {
    const fake_user = await this.create_new_user({ password: '123' });
    const res = await request(app)
      .post('/v1/user/login')
      .send({ password: '123', email: fake_user.email });
    return { ...res.body.data, ...fake_user };
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

  static generate_random_table_hand = async (table_params = {}) => {
    const { Game } = models;
    const random_game = await this.generate_random_game();
    const game = await Game.create(random_game);
    const card = await this.generate_random_card()

    return {
      player_cards: [card, card],
      dealer_cards: [card],
      player_points: parseInt(card.value) + parseInt(card.second_value),
      dealer_points: parseInt(card.value),
      bet_value: 10.5,
      game_id: game.id,
      user_id: random_game.user_id,
      ...table_params,
    };
  };

  static generate_token = (payload = { test: 'test' }) =>
    JWTUtils.generateaccess_token(payload);

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
