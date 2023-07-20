const { models } = require('../../src/models');
const Lib = require('../../src/utils/lib');
const TestHelpers = require('../helpers/test_helpers');
const ModelPropertyTester = require('../helpers/test_model_properties');
const enums = require('../../src/enum');

let Card;
let random_card;
let card_property_tester;

describe('Card model', () => {
  beforeAll(async () => {
    await TestHelpers.start_db();
  });

  afterAll(async () => {
    await TestHelpers.stop_db();
  });

  beforeEach(async () => {
    await TestHelpers.sync_db();
    random_card = TestHelpers.generate_random_card();
    Card = models.Card;
    card_property_tester = new ModelPropertyTester('Card');
  });

  describe('Properties', () => {
    describe('Rank', () => {
      it('should be an enum that goes from 1-13', async () => {
        await card_property_tester.test_store_enum_values(
          enums.card_rank,
          'rank'
        );
      });
      it('should not allow values that are not in the enum', async () => {
        await card_property_tester.test_invalid_enum_value('rank', 'test123');
      });
      it('should not allow null values', async () => {
        await card_property_tester.test_property_error({
          data: { ...random_card, rank: null },
          error_message: 'Card.rank cannot be null',
        });
      });
    });

    describe('Suit', () => {
      it('should be an enum hearts, clubs, diamonds, spades', async () => {
        await card_property_tester.test_store_enum_values(
          enums.card_suit,
          'suit'
        );
      });
      it('should not allow values that are not in the enum', async () => {
        await card_property_tester.test_invalid_enum_value('suit', 'test123');
      });
      it('should not allow null values', async () => {
        await card_property_tester.test_property_error({
          data: { ...random_card, suit: null },
          error_message: 'Card.suit cannot be null',
        });
      });
    });

    /*    describe('Value', () => {
      // TODO FIX THIS TEST
      it('should be an enum one to 11', async () => {
        await card_property_tester.test_store_enum_values(
          enums.card_values,
          'value',
          TestHelpers.sync_db
        );
      });
       it('should not allow values that are not in the enum', async () => {
        await card_property_tester.test_invalid_enum_value('value', 'test123');
      }); 
      it('should not allow null values', async () => {
        await card_property_tester.test_property_error({
          data: { ...random_card, value: null },
          error_message: 'Card.value cannot be null',
        });
      }); 
    }); */

    /* describe('Second value', () => {
      it('should be an enum one to 11', async () => {
        await card_property_tester.test_store_enum_values(
          enums.card_values,
          'second_value',
          TestHelpers.sync_db
        );
      });
      it('should not allow values that are not in the enum', async () => {
        await card_property_tester.test_invalid_enum_value(
          'second_value',
          'test123'
        );
      });
      it('should allow null values', async () => {
        await card_property_tester.test_create_property(null, 'second_value');
      });
    });  */
  });
});
