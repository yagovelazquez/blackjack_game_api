const _ = require('lodash');
const { models } = require('../../src/models');
const DeckUtils = require('../../src/utils/deck_utils');
const deck_utils = require('../../src/utils/deck_utils');

jest.mock('../../src/models', () => {
  return {
    models: {
      Card: {
        findAll: jest.fn(),
      },
    },
  };
});

const { Card } = models;

describe('deck_utils', () => {
  let deck_utils;
  let fake_db_cards;

  beforeEach(() => {
    deck_utils = new DeckUtils();
    fake_db_cards = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create_shuffled_deck', () => {
    it('should create a deck with the specified number of cards and shuffle it', async () => {
      Card.findAll.mockResolvedValue(fake_db_cards);
      const deck_count = 3;
      const deck_3_times = _.flatten(_.times(deck_count, () => fake_db_cards));
      await deck_utils.create_shuffled_deck({ deck_count });

      expect(Card.findAll).toHaveBeenCalled();
      expect(deck_utils.deck).not.toEqual(deck_3_times);
      expect(deck_utils.deck.length).toBe(fake_db_cards.length * deck_count);
      deck_utils.deck.forEach((card) => {
        expect(card).toHaveProperty('id');
      });
    });
    it('should throw a new error if deck_count is 0 or under 0', async () => {
      Card.findAll.mockResolvedValue(fake_db_cards);

      const deck_count_zero = 0;
      await expect(
        deck_utils.create_shuffled_deck({ deck_count: deck_count_zero })
      ).rejects.toThrow('Invalid deck_count. Must be greater than 0.');

      const deck_count_negative = -5;
      await expect(
        deck_utils.create_shuffled_deck({ deck_count: deck_count_negative })
      ).rejects.toThrow('Invalid deck_count. Must be greater than 0.');

      expect(Card.findAll).not.toHaveBeenCalled();
    });
  });

  describe('shuffle', () => {
    it('should shuffle the deck', () => {
      deck_utils.deck = [...fake_db_cards];

      deck_utils.shuffle();
      const shuffed_deck = deck_utils.deck;

      expect(shuffed_deck).not.toEqual(fake_db_cards);
      expect(shuffed_deck.length).toEqual(fake_db_cards.length);
    });

    it('should throw an error if deck is not defined or empty', () => {
      deck_utils.deck = undefined;
      expect(() => deck_utils.shuffle()).toThrow(
        'Deck is not defined or empty. Cannot shuffle.'
      );

      deck_utils.deck = [];
      expect(() => deck_utils.shuffle()).toThrow(
        'Deck is not defined or empty. Cannot shuffle.'
      );
    });
  });
});
