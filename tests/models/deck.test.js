const { models } = require('../../src/models');
const Lib = require('../../src/utils/lib');
const TestHelpers = require('../helpers/test_helpers');
const ModelPropertyTester = require('../helpers/test_model_properties');
const enums = require('../../src/enum');
const card_seeder = require('../../src/database/function_seeders/cards');

let Card;
let random_deck;
let Deck;
let deck_property_tester;
let random_game;

describe('Card model', () => {
  beforeAll(async () => {
    await TestHelpers.start_db();
  });

  afterAll(async () => {
    await TestHelpers.stop_db();
  });

  beforeEach(async () => {
    await TestHelpers.sync_db();
    const random_game_data = await TestHelpers.generate_random_game();
    random_game = await models.Game.create(random_game_data);
    Card = models.Card;
    Deck = models.Deck;
    await TestHelpers.seed_database({
      model_name: 'Card',
      seed_data: card_seeder(Card),
    });
    deck_property_tester = new ModelPropertyTester('Deck');
    random_deck = await TestHelpers.generate_random_deck();
  });


  describe('Properties', () => {
    it('should create and store in a random order in database', async () => {
      const deck = await Deck.create(random_deck);
      expect(deck.cards).not.toEqual(random_deck.cards);
      expect(deck.cards.length).toBe(random_deck.cards.length)
      expect(deck.cards[0]).toHaveProperty('id')
    });
    it('should have a relationship 1-1 with game', async () => {
      const deck = await Deck.create({
        ...random_deck,
        game_id: random_game.id,
      });
      const stored_deck = await Deck.findByPk(deck.id, {
        include: 'game',
      });
      expect(stored_deck.game).toBeDefined();
      expect(stored_deck.game.id).toBe(random_game.id);
    });
    it('should not allow null values', async () => {
      await deck_property_tester.test_property_error({
        data: { ...random_deck, cards: null },
        error_message: 'Deck.cards cannot be null',
      });
    });
  });
});
