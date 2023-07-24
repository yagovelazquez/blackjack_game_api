const _ = require('lodash');
const { models } = require('../../src/models');
const HandUtils = require('../../src/utils/hand_utils');
const enums = require('../../src/enum');

jest.mock('../../src/models', () => {
  return {
    models: {
      Card: {
        findAll: jest.fn(),
      },
      TableHand: {
        finish_hand: jest.fn(),
        save: jest.fn(),
      },
      Deck: {
        save: jest.fn(),
      },
      Game: {
        save: jest.fn(),
      },
      User: {
        save: jest.fn(),
      },
    },
  };
});

const { Card, TableHand, Deck, User } = models;

describe('hand_utils', () => {
  let hand_utils;
  let fake_db_cards;

  beforeEach(() => {
    hand_utils = new HandUtils();
    fake_db_cards = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save instances', () => {
    it('should call save() on each non-empty instance', async () => {
      const deck =  {test: 'test', save: jest.fn()};
      const game = {test: 'test', save: jest.fn()};
      const user = {test: 'test', save: jest.fn()};
      const table_hand = {};
  
      hand_utils.deck = deck;
      hand_utils.game = game;
      hand_utils.user = user;
      hand_utils.table_hand = table_hand;
  
      const deck_save_spy = jest.spyOn(deck, 'save');
      const game_save_spy = jest.spyOn(game, 'save');
      const user_save_spy = jest.spyOn(user, 'save');
    
      await hand_utils.save_instances();
  
      expect(deck_save_spy).toHaveBeenCalled();
      expect(game_save_spy).toHaveBeenCalled();
      expect(user_save_spy).toHaveBeenCalled();
    });
  })

  describe('handle_player_21_points', () => {
    it('should handle player with 21 points and dealer with 21 points as a draw', async () => {
      hand_utils.player.cards = [{ value: enums.card_values.ten }, { value: enums.card_values.one }];
      hand_utils.dealer.cards = [{ value: enums.card_values.ten }, { value: enums.card_values.one }];

      await hand_utils.handle_player_21_points();

      expect(hand_utils.winner).toBe(enums.game_winner.DRAW);
      expect(TableHand.finish_hand).toHaveBeenCalledWith(
        expect.objectContaining({
          winner: enums.game_winner.DRAW,
        })
      );
    });
    it('should handle player with 21 points and dealer with 20 points as a win for player', async () => {
      hand_utils.player.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
        { value: enums.card_values.one },
      ];
      hand_utils.dealer.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
      ];
      await hand_utils.handle_player_21_points();

      expect(hand_utils.winner).toBe(enums.game_winner.PLAYER);
      expect(TableHand.finish_hand).toHaveBeenCalledWith(
        expect.objectContaining({
          winner: enums.game_winner.PLAYER,
        })
      );
    });
  });

  describe('set_properties', () => {
    it('should set properties correctly', () => {
      const hand_utils = new HandUtils();
      const props = {
        deck: { cards: ['test'] },
        game: { test: 'test' },
        user: { test: 'test' },
        table_hand: { test: 'test' },
        dealer: { cards: ['test'], points: 17, is_busted: false },
        player: { cards: ['test'], points: 19, is_busted: false },
        winner: enums.game_winner.PLAYER,
      };

      hand_utils.set_properties(props);

      expect(hand_utils.deck).toEqual(props.deck);
      expect(hand_utils.game).toEqual(props.game);
      expect(hand_utils.user).toEqual(props.user);
      expect(hand_utils.table_hand).toEqual(props.table_hand);
      expect(hand_utils[enums.game_participants.DEALER]).toEqual(props.dealer);
      expect(hand_utils[enums.game_participants.PLAYER]).toEqual(props.player);
      expect(hand_utils.winner).toEqual(props.winner);
    });

    it('should not set unknown properties', () => {
      const props = {
        unknownProperty: 'This property should not be set',
      };

      hand_utils.set_properties(props);
      expect(hand_utils.unknownProperty).toBeUndefined();
    });
  });

  describe('check_who_won_hand', () => {
    it('should set the winner as DEALER if the player is busted', () => {
      hand_utils.player.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
      ];
      hand_utils.check_who_won_hand();
      expect(hand_utils.winner).toBe(enums.game_winner.DEALER);
    });

    it('should set the winner as PLAYER if the dealer is busted', () => {
      hand_utils.dealer.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
      ];
      hand_utils.check_who_won_hand();
      expect(hand_utils.winner).toBe(enums.game_winner.PLAYER);
    });

    it('should set the winner as DRAW if both player and dealer have same points', () => {
      hand_utils.player.cards = [{ value: enums.card_values.ten }];
      hand_utils.dealer.cards = [{ value: enums.card_values.ten }];

      hand_utils.check_who_won_hand();
      expect(hand_utils.winner).toBe(enums.game_winner.DRAW);
    });

    it('should set the winner as PLAYER if player have more points', () => {
      hand_utils.player.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
      ];
      hand_utils.dealer.cards = [{ value: enums.card_values.ten }];

      hand_utils.check_who_won_hand();
      expect(hand_utils.winner).toBe(enums.game_winner.PLAYER);
    });

    it('should set the winner as DEALER if dealer have more points', () => {
      hand_utils.dealer.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
      ];
      hand_utils.player.cards = [{ value: enums.card_values.ten }];
      hand_utils.check_who_won_hand();
      expect(hand_utils.winner).toBe(enums.game_winner.DEALER);
    });
  });

  describe('is_busted', () => {
    it('should return true if > 21', () => {
      hand_utils.dealer.points = 22;
      hand_utils.player.points = 22;
      expect(
        hand_utils.is_busted({ participant: enums.game_participants.DEALER })
      ).toEqual(true);
      expect(
        hand_utils.is_busted({ participant: enums.game_participants.PLAYER })
      ).toEqual(true);
    });
    it('should return false if <= 21', () => {
      hand_utils.dealer.points = 21;
      hand_utils.player.points = 21;
      expect(
        hand_utils.is_busted({ participant: enums.game_participants.DEALER })
      ).toEqual(false);
      expect(
        hand_utils.is_busted({ participant: enums.game_participants.PLAYER })
      ).toEqual(false);
    });
  });

  describe('dealer_play', () => {
    let initialDealerCards, next_card;
    beforeEach(() => {
      next_card = { value: enums.card_values.five };
      initialDealerCards = [
        { value: enums.card_values.nine },
        { value: enums.card_values.three },
      ];
      hand_utils = new HandUtils({
        dealer: {
          cards: [...initialDealerCards],
        },
        deck: { cards: [next_card, { value: enums.card_values.five }] },
      });
      Card.findAll.mockResolvedValue([next_card]);
    });
    it('should continue taking cards until the total is 17 or more', async () => {
      hand_utils.count_points();

      await hand_utils.dealer_play();
      expect(hand_utils.dealer.cards).toEqual([
        ...initialDealerCards,
        next_card,
      ]);
      expect(hand_utils.dealer.points).toBe(17);
    });
    it('should continue not taking cards when the total is 17 or more', async () => {
      hand_utils.dealer.cards.push({ value: enums.card_values.five });
      initialDealerCards.push({ value: enums.card_values.five });
      const spy_deal_cards = jest.spyOn(hand_utils, 'deal_card');
      hand_utils.count_points();

      await hand_utils.dealer_play();

      expect(hand_utils.dealer.cards).toEqual([...initialDealerCards]);
      expect(hand_utils.dealer.points).toBe(17);
      expect(spy_deal_cards).not.toHaveBeenCalled();
    });
  });

  describe('deal_card', () => {
    it('should deal the specified quantity of cards from the deck', async () => {
      hand_utils.deck = { cards: fake_db_cards };
      const dealt_cards_arr = [
        fake_db_cards[0],
        fake_db_cards[1],
        fake_db_cards[2],
      ];
      Card.findAll.mockResolvedValue(dealt_cards_arr);
      const dealt_cards = await hand_utils.deal_card({
        card_quantity: 3,
        participant: enums.game_participants.DEALER,
      });

      const expected_dealt_cards = [
        fake_db_cards[0],
        fake_db_cards[1],
        fake_db_cards[2],
      ];
      expect(dealt_cards).toEqual(expected_dealt_cards);
      expect(hand_utils.deck.cards).toEqual([
        fake_db_cards[3],
        fake_db_cards[4],
      ]);
      expect(hand_utils[enums.game_participants.DEALER].cards).toEqual(
        expected_dealt_cards
      );
    });
    it('should throw an error if card_quantity is equal or lower than 0', async () => {
      hand_utils.deck = fake_db_cards;
      await expect(
        hand_utils.deal_card({
          card_quantity: 0,
          participant: enums.game_participants.DEALER,
        })
      ).rejects.toThrow('Invalid card_quantity. It should be greater than 0.');
      await expect(
        hand_utils.deal_card({
          card_quantity: -2,
          participant: enums.game_participants.DEALER,
        })
      ).rejects.toThrow('Invalid card_quantity. It should be greater than 0.');
    });
  });

  describe('count_points', () => {
    it('should count both dealer and player cards', () => {
      const dealer_cards = [
        { value: enums.card_values.four },
        { value: enums.card_values.three },
        { value: enums.card_values.five },
      ];
      const player_cards = [
        { value: enums.card_values.four },
        { value: enums.card_values.three },
        { value: enums.card_values.nine },
      ];
      hand_utils.player.cards = player_cards;
      hand_utils.dealer.cards = dealer_cards;
      hand_utils.count_points();
      expect(hand_utils.dealer.points).toBe(12);
      expect(hand_utils.player.points).toBe(16);
    });
    it('should return the card values sum if there is no ace', () => {
      const dealer_cards = [
        { value: enums.card_values.four },
        { value: enums.card_values.three },
        { value: enums.card_values.five },
      ];

      hand_utils.dealer.cards = dealer_cards;

      hand_utils.count_points();
      expect(hand_utils.dealer.points).toBe(12);
    });
    it('ace should have value 11 if points are less than 21', () => {
      const cards = [
        { value: enums.card_values.one },
        { value: enums.card_values.four },
        { value: enums.card_values.four },
      ];
      hand_utils.dealer.cards = cards;
      hand_utils.count_points();
      expect(hand_utils.dealer.points).toBe(19);
    });
    it('ace should have value 1 if points are higher than 21', () => {
      const cards = [
        { value: enums.card_values.one },
        { value: enums.card_values.ten },
        { value: enums.card_values.ten },
      ];
      hand_utils.dealer.cards = cards;
      hand_utils.count_points();
      hand_utils.count_points();
      expect(hand_utils.dealer.points).toBe(21);
    });
    it('should throw an error if cards is not an array', () => {
      hand_utils.dealer.cards = undefined;
      expect(() => hand_utils.count_points()).toThrow('Provide a valid array');
    });
  });
});
