/* handTable => {
    id,
    game_id,
    player_id,
    dealer_cards,
    player_cards,
    player_bet_value,
    } */
// make an association with game_id  1 to many
// make an association with player_id 1 to many
const enums = require('../../src/enum');
const { models } = require('../../src/models');
const Lib = require('../../src/utils/lib');
const TestHelpers = require('../helpers/test_helpers');
const ModelPropertyTester = require('../helpers/test_model_properties');

let Game;
let TableHand;
let random_table_hand;

describe('Table hand', () => {
  let random_table_hand;
  beforeAll(async () => {
    await TestHelpers.start_db();
  });

  afterAll(async () => {
    await TestHelpers.stop_db();
  });

  beforeEach(async () => {
    await TestHelpers.sync_db();
    random_table_hand = await TestHelpers.generate_random_table_hand();
    Game = models.Game;
    TableHand = models.TableHand;
  });

  describe('Properties', () => {
    describe('game_id / user_id', () => {
      it('should have a relationship many to one with Game', async () => {
        await TableHand.create(random_table_hand);
        await TableHand.create(random_table_hand);
        const { User, Game } = models;
        const fetchedUser = await User.findByPk(random_table_hand.user_id, {
          include: 'table_hands',
        });
        const fetchedGame = await Game.findByPk(random_table_hand.game_id, {
          include: 'table_hands',
        });
        expect(fetchedUser.table_hands).toHaveLength(2);
        expect(fetchedGame.table_hands).toHaveLength(2);
      });
    });
    describe('player_bet_value', () => {
      it('should create a game and return a valid decimal number', async () => {
        const table_hand = await TableHand.create(random_table_hand);
        expect(typeof table_hand.bet_value).toBe('number');
        expect(table_hand.bet_value % 1 !== 0).toBe(true);
        expect(table_hand.bet_value).toEqual(random_table_hand.bet_value);
      });
      it('should return an error if bet_value is smaller or equal 0', async () => {
        const table_hand_property_validator = new ModelPropertyTester(
          'TableHand'
        );
        await table_hand_property_validator.test_property_error({
          data: {
            bet_value: 0,
          },
          error_message: 'Value must be greater than 0.',
        });
      });
      it('should not allow null values', async () => {
        const table_hand_property_validator = new ModelPropertyTester(
          'TableHand'
        );
        await table_hand_property_validator.test_property_error({
          data: { bet_value: null },
          error_message: 'TableHand.bet_value cannot be null',
        });
      });
      it('should store only the last 2 decimal points', async () => {
        random_table_hand.bet_value = 100.4442;
        const {
          created_instance: table_hand,
          stored_db_instance: db_table_hand,
        } = await TestHelpers.create_and_find_in_db(
          'TableHand',
          random_table_hand
        );
        expect(typeof table_hand.bet_value).toBe('number');
        expect(
          Lib.number_has_decimal_places({
            number: db_table_hand.bet_value,
            decimal_places: 2,
          })
        ).toBe(true);
      });
      it('should have a maximum of 10 digits', async () => {
        random_table_hand.bet_value = 19999999999;
        const error_message =
          "Out of range value for column 'bet_value' at row 1";
        let err;
        try {
          await TableHand.create(random_table_hand);
        } catch (error) {
          err = error.message;
        }
        expect(err).toBeDefined();
        expect(err).toEqual(error_message);
      });
    });
  });
});
