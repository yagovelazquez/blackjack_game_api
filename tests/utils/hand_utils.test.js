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
    fake_db_cards = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    hand_utils = new HandUtils({ deck: { cards: fake_db_cards } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle_player_is_busted', () => {
    let spy_on_who_won_hand, spy_on_finish_hand;
    beforeEach(() => {
      spy_on_finish_hand = jest.spyOn(hand_utils, 'finish_hand');
      spy_on_who_won_hand = jest.spyOn(hand_utils, 'check_who_won_hand');
    });
    it('should call check_who_won_hand and finish table if player is busted', async () => {
      hand_utils.player.is_busted = true;
      await hand_utils.handle_player_is_busted();
      expect(spy_on_finish_hand).toHaveBeenCalled();
      expect(spy_on_who_won_hand).toHaveBeenCalled();
    });
    it('should not call any method if player hand is not busted', async () => {
      hand_utils.player.is_busted = false;
      await hand_utils.handle_player_is_busted();
      expect(spy_on_finish_hand).not.toHaveBeenCalled();
      expect(spy_on_who_won_hand).not.toHaveBeenCalled();
    });
  });

  describe('save instances', () => {
    it('should call save() on each non-empty instance', async () => {
      const deck = { test: 'test', update: jest.fn() };
      const game = { test: 'test', save: jest.fn() };
      const table_hand = { test: 'test', update: jest.fn() };

      hand_utils.deck = deck;
      hand_utils.game = game;
      hand_utils.table_hand = table_hand;

      const deck_update_spy = jest.spyOn(deck, 'update');
      const game_save_spy = jest.spyOn(game, 'save');
      const table_update_spy = jest.spyOn(table_hand, 'update');

      await hand_utils.save_instances();

      expect(deck_update_spy).toHaveBeenCalled();
      expect(game_save_spy).toHaveBeenCalled();
      expect(table_update_spy).toHaveBeenCalled();
    });
  });

  describe('handle_player_21_points', () => {
    let finish_hand_spy;
    beforeEach(() => {
      finish_hand_spy = jest.spyOn(hand_utils, 'finish_hand');
    });
    it('should handle player with 21 points and dealer with 21 points as a draw', async () => {
      hand_utils.player.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.one },
      ];
      hand_utils.dealer.cards = [
        { value: enums.card_values.ten },
        { value: enums.card_values.one },
      ];

      await hand_utils.handle_player_21_points();

      expect(hand_utils.winner).toBe(enums.game_winner.DRAW);
      expect(finish_hand_spy).toHaveBeenCalled();
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
      expect(finish_hand_spy).toHaveBeenCalled();
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

  describe('finish_hand', () => {
    describe('dealer wins', () => {
      beforeEach(() => {
        hand_utils.winner = enums.game_winner.DEALER;
      });
      it('should update game house balance fluctuation and user fluctuation if dealer wins', () => {
        hand_utils.table_hand.bet_value = 20;
        hand_utils.finish_hand();
        expect(hand_utils.game.house_balance_fluctuation).toEqual(20);
        expect(hand_utils.game.user_balance_fluctuation).toEqual(-20);
      });
      it('should update fluctuations with 0 if table_hand.bet_value does not exists', () => {
        hand_utils.table_hand.bet_value = undefined;
        hand_utils.finish_hand();
        expect(hand_utils.game.house_balance_fluctuation).toEqual(0);
        expect(hand_utils.game.user_balance_fluctuation).toEqual(0);
      });
    });

    describe('player wins', () => {
      beforeEach(() => {
        hand_utils.winner = enums.game_winner.PLAYER;
        hand_utils.table_hand.bet_value = 20;
      });
      it('should update game house balance fluctuation and user fluctuation if dealer wins', () => {
        hand_utils.finish_hand();
        expect(hand_utils.game.house_balance_fluctuation).toEqual(-20);
        expect(hand_utils.game.user_balance_fluctuation).toEqual(20);
      });
      it('should update fluctuations with 0 if table_hand.bet_value does not exists', () => {
        hand_utils.table_hand.bet_value = undefined;
        hand_utils.finish_hand();
        expect(hand_utils.game.house_balance_fluctuation).toEqual(0);
        expect(hand_utils.game.user_balance_fluctuation).toEqual(0);
      });
      it('should update user.balance to add 2 times the bet value', () => {
        hand_utils.user = { balance: 10 };
        hand_utils.finish_hand();
        expect(hand_utils.user.balance).toEqual(
          10 + 2 * hand_utils.table_hand.bet_value
        );
      });
      it('should update user.balance to add 2 times 0 if the bet value is not defined', () => {
        hand_utils.user = { balance: 10 };
        hand_utils.table_hand.bet_value = undefined;
        hand_utils.finish_hand();
        expect(hand_utils.user.balance).toEqual(10 + 2 * 0);
      });
    });

    describe('game is a draw', () => {
      beforeEach(() => {
        hand_utils.winner = enums.game_winner.DRAW;
        hand_utils.table_hand.bet_value = 20;
        hand_utils.user = { balance: 10 };
      });
      it('should restore 1 bet value when game is a draw', () => {
        hand_utils.finish_hand();
        expect(hand_utils.user.balance).toEqual(
          10 + hand_utils.table_hand.bet_value
        );
      });
      it('should restore 0 if bet_vañue is not defined', () => {
        hand_utils.table_hand.bet_value = undefined;
        hand_utils.finish_hand();
        expect(hand_utils.user.balance).toEqual(10);
      });
    });
  });

  describe('deal_card', () => {
    it('should remove from this.cards the cards, and push it to player or dealer', async () => {
      hand_utils.deck = { cards: fake_db_cards };
      const [cardOne, cardTwo, cardThree, ...restCards] = fake_db_cards;
      const dealt_cards_arr = [cardOne, cardTwo, cardThree];
      Card.findAll.mockResolvedValue(dealt_cards_arr);
      const dealt_cards = await hand_utils.deal_card({
        card_quantity: 3,
        participant: enums.game_participants.DEALER,
      });

      expect(dealt_cards).toEqual(dealt_cards_arr);
      expect(hand_utils.cards).toEqual(restCards);
      expect(hand_utils[enums.game_participants.DEALER].cards).toEqual(
        dealt_cards_arr
      );
    });
    it('should get cards from database', async () => {
      await hand_utils.deal_card({ card_quantity: 1, participant: 'dealer' });
      expect(Card.findAll).toHaveBeenCalled();
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
