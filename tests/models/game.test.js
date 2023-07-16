const enums = require('../../src/enum');
const { models } = require('../../src/models');
const Lib = require('../../src/utils/lib');
const TestHelpers = require('../helpers/test_helpers');
const ModelPropertyValidator = require('../helpers/test_property_validator');

let Game;

describe('Game model', () => {
  let random_game;
  beforeAll(async () => {
    await TestHelpers.start_db();
  });

  afterAll(async () => {
    await TestHelpers.stop_db();
  });

  beforeEach(async () => {
    await TestHelpers.sync_db();
    random_game = await TestHelpers.generate_random_game();
    Game = models.Game;
  });

  describe('model properties', () => {
    describe('user_id', () => {
      it('game should have a relationship many to one with users', async () => {
        await Game.bulkCreate([random_game, random_game]);
        const { User } = models;
        const fetchedUser = await User.findByPk(random_game.user_id, {
          include: 'games',
        });
        expect(fetchedUser.games).toHaveLength(2);
      });
    });
    describe('status', () => {
      it('should return a enum property correctly', async () => {
        const status = enums.game_status.COMPLETED;
        random_game.status = status;

        try {
          await Game.create(random_game);
        } catch (error) {
          console.log(error);
        }
        const games = await Game.findAll({
          where: {
            status,
          },
        });
        expect(games.length).toBe(1);
        expect(games[0].status).toEqual(status);
      });
      it('should be defaulting to in_progress if no value is passed', async () => {
        delete random_game.status;
        const { stored_db_instance: db_game } =
          await TestHelpers.create_and_find_in_db('Game', random_game);
        expect(db_game.status).toEqual(enums.game_status.IN_PROGRESS);
      });
      it('should not allow null status value', async () => {
        const model_property_validator = new ModelPropertyValidator('Game');
        await model_property_validator.test_property_error({
          data: { status: null },
          error_message: 'Game.status cannot be null',
        });
      });
    });

    describe('house_balance_fluctuation', () => {
      it('should create a game and return a valid decimal number', async () => {
        const game = await Game.create(random_game);
        expect(typeof game.house_balance_fluctuation).toBe('number');
        expect(game.house_balance_fluctuation % 1 !== 0).toBe(true);
        expect(game.house_balance_fluctuation).toEqual(
          random_game.house_balance_fluctuation
        );
      });
      it('should store only the last 2 decimal points', async () => {
        random_game.house_balance_fluctuation = 100.4442;
        const { created_instance: game, stored_db_instance: db_game } =
          await TestHelpers.create_and_find_in_db('Game', random_game);
        expect(typeof game.house_balance_fluctuation).toBe('number');
        expect(
          Lib.number_has_decimal_places({
            number: db_game.house_balance_fluctuation,
            decimal_places: 2,
          })
        ).toBe(true);
      });
      it('should have a maximum of 10 digits', async () => {
        random_game.house_balance_fluctuation = 19999999999;
        const error_message =
          "Out of range value for column 'house_balance_fluctuation' at row 1";
        let err;
        try {
          await Game.create(random_game);
        } catch (error) {
          err = error.message;
        }
        expect(err).toBeDefined();
        expect(err).toEqual(error_message);
      });
      it('should not allow null values', async () => {
        const model_property_validator = new ModelPropertyValidator('Game');
        await model_property_validator.test_property_error({
          data: { house_balance_fluctuation: null },
          error_message: 'Game.house_balance_fluctuation cannot be null',
        });
      });
      it('should be defaulting to 0', async () => {
        delete random_game.house_balance_fluctuation;
        const { stored_db_instance: db_game } =
          await TestHelpers.create_and_find_in_db('Game', random_game);
        expect(db_game.house_balance_fluctuation).toEqual('0.00');
      });
    });

    describe('user_balance_fluctuation', () => {
      it('should create a game and return a value that is the opposite of house_balance_fluctuation', async () => {
        const { stored_db_instance: db_game } =
          await TestHelpers.create_and_find_in_db('Game', random_game);
        expect(Number(db_game.user_balance_fluctuation)).toBe(
          -Number(db_game.house_balance_fluctuation)
        );
      });
      it('should create a game and return a 0 if house balance fluctuation is 0', async () => {
        random_game.house_balance_fluctuation = 0;
        const { stored_db_instance: db_game } =
          await TestHelpers.create_and_find_in_db('Game', random_game);
        expect(Number(db_game.user_balance_fluctuation)).toBe(0);
      });
      it('should store only the last 2 decimal points', async () => {
        random_game.user_balance_fluctuation = 100.4442;
        const { created_instance: game, stored_db_instance: db_game } =
          await TestHelpers.create_and_find_in_db('Game', random_game);
        expect(typeof game.user_balance_fluctuation).toBe('number');
        expect(
          Lib.number_has_decimal_places({
            number: db_game.user_balance_fluctuation,
            decimal_places: 2,
          })
        ).toBe(true);
      });
      it('should not allow null values', async () => {
        const model_property_validator = new ModelPropertyValidator('Game');
        await model_property_validator.test_property_error({
          data: { user_balance_fluctuation: null },
          error_message: 'Game.user_balance_fluctuation cannot be null',
        });
      });
    });
  });
});
