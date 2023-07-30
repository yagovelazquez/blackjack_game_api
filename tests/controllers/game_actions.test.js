const request = require('supertest');
const TestHelpers = require('../helpers/test_helpers');
const { models } = require('../../src/models');
const ModelTestHelper = require('../helpers/model_test_helper');
const { get_all_cards } = require('../../src/database/function_seeders/cards');
const enums = require('../../src/enum');
const MockModelFunctions = require('../helpers/mock/mock_model_functions');
const HandUtils = require('../../src/utils/hand_utils');

describe('game_actions', () => {
  let user, app, Game, game, Card, User, Deck, TableHand, mock_deck_model;

  beforeAll(async () => {
    await TestHelpers.start_db();
    app = TestHelpers.get_app();
    Game = models.Game;
    User = models.User;
    TableHand = models.TableHand;
    Card = models.Card;
    Deck = models.Deck;
    mock_deck_model = new MockModelFunctions('Deck');
  });
  afterAll(async () => {
    await TestHelpers.stop_db();
  });
  beforeEach(async () => {
    await TestHelpers.sync_db();
    user = await TestHelpers.create_user_and_get_token(app);
    game_tester = new ModelTestHelper('Game');
    game = await game_tester.create({ user_id: user.dataValues.id });
    await TestHelpers.seed_database({
      model_name: 'Card',
      seed_data: get_all_cards(),
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('POST /game/:game_id/deal', () => {
    it('should return dealer data, player data, winner as undefined, and table hand id', async () => {
      mock_deck_model.create();
      const bet_value = 30;
      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value })
        .expect(200);
      expect(res.body.message).toEqual('Action: deal was done successfully');
      expect(res.body.success).toEqual(true);

      expect(Object.keys(res.body.data)).toEqual([
        'dealer',
        'player',
        'table_hand_id',
      ]);

      expect(Object.keys(res.body.data.player)).toEqual([
        'cards',
        'points',
        'is_busted',
      ]);

      expect(Object.keys(res.body.data.dealer)).toEqual([
        'cards',
        'points',
        'is_busted',
      ]);

      expect(res.body.data.winner).not.toBeDefined();

      expect(res.body.data.player.points).toBeDefined();
      expect(typeof res.body.data.player.points).toBe('number');

      expect(res.body.data.dealer.points).toBeDefined();
      expect(typeof res.body.data.dealer.points).toBe('number');

      expect(res.body.data.dealer.cards.length).toBe(1);
      expect(Object.keys(res.body.data.dealer.cards[0])).toEqual([
        'id',
        'rank',
        'suit',
        'value',
        'second_value',
      ]);

      expect(res.body.data.player.cards.length).toBe(2);
      expect(Object.keys(res.body.data.player.cards[0])).toEqual([
        'id',
        'rank',
        'suit',
        'value',
        'second_value',
      ]);
      expect(Object.keys(res.body.data.player.cards[1])).toEqual([
        'id',
        'rank',
        'suit',
        'value',
        'second_value',
      ]);
    });
    it('should update users balance', async () => {
      const bet_value = 30;
      mock_deck_model.create();
      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value })
        .expect(200);

      const updated_user = await User.findByPk(user.dataValues.id);
      expect(updated_user.balance).toEqual(
        (user.dataValues.balance - bet_value).toFixed(2)
      );
    });
    it('should create a new shuffled deck, with around 210 cards', async () => {
      const bet_value = 30;
      const spy_shuffled_deck = jest.spyOn(Deck, 'create_shuffled_deck');
      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value })
        .expect(200);
      const deck_after_endpoint = await Deck.findOne({
        where: {
          game_id: game.id,
        },
      });

      expect(spy_shuffled_deck).toHaveBeenCalled();
      expect(deck_after_endpoint).toBeDefined();
      expect(deck_after_endpoint.cards).toBeDefined();
      expect(deck_after_endpoint.cards.length).toBeGreaterThanOrEqual(
        52 * 4 - 10
      );
      expect(deck_after_endpoint.cards.length).toBeLessThan(52 * 4);
    });
    it('should create a new table hand, with player info and dealer info', async () => {
      const bet_value = 30;
      mock_deck_model.create();
      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value })
        .expect(200);

      const table_hand_after_endpoint = await TableHand.findOne({
        where: {
          user_id: user.dataValues.id,
          game_id: game.id,
        },
      });
      expect(table_hand_after_endpoint).toBeDefined();
      expect(table_hand_after_endpoint.dealer_cards.length).toEqual(1);
      expect(table_hand_after_endpoint.player_cards.length).toEqual(2);
      expect(table_hand_after_endpoint.player_points).toBeDefined();
      expect(table_hand_after_endpoint.dealer_points).toBeDefined();
      expect(+table_hand_after_endpoint.bet_value).toEqual(bet_value);
    });
    it('should return 400 if user not found', async () => {
      const user2 = await TestHelpers.create_user_and_get_token(app);
      await User.destroy({
        where: {
          id: user2.dataValues.id,
        },
      });
      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user2.access_token}`)
        .send({ bet_value: 30 })
        .expect(400);
      expect(res.body.message).toEqual('User was not found');
      expect(res.body.success).toEqual(false);
    });

    it('should return 400 if balance < bet_value', async () => {
      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value: user.dataValues.balance + 1 })
        .expect(400);
      expect(res.body.message).toEqual('Your balance is too low');
      expect(res.body.success).toEqual(false);
    });

    it('should return 400 if game not found', async () => {
      const res = await request(app)
        .post(`/v1/game/200/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value: 30 })
        .expect(400);
      expect(res.body.message).toEqual('Game was not found');
      expect(res.body.success).toEqual(false);
    });
    it('should return status 401 if user not logged in', async () => {
      const res = await request(app)
        .post('/v1/game/start')
        .set('Authorization', `Bearer 123`)
        .expect(401);
      expect(res.body.message).toEqual('Invalid token');
      expect(res.body.success).toEqual(false);
    });
    it('if player_points are 21 and dealer is 21, it should return a draw', async () => {
      mock_deck_model.create({
        cards: [
          {
            id: '1h',
          },
          {
            id: '1h',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
        ],
      });

      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value: 30 })
        .expect(200);
      const table_hand_db = await TableHand.findOne({
        where: {
          game_id: game.id,
        },
      });
      expect(table_hand_db.winner).toEqual(enums.game_winner.DRAW);
      expect(res.body.message).toEqual('Action: deal was done successfully');
      expect(res.body.success).toEqual(true);
      expect(res.body.data.winner).toEqual(enums.game_winner.DRAW);
    });

    it('if player_points are 21 and dealer is different than 21, it should return winner as player ', async () => {
      mock_deck_model.create({
        cards: [
          {
            id: '6h',
          },
          {
            id: '1h',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
        ],
      });

      const res = await request(app)
        .post(`/v1/game/${game.id}/deal`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ bet_value: 30 })
        .expect(200);
      const table_hand_db = await TableHand.findOne({
        where: {
          game_id: game.id,
        },
      });
      expect(table_hand_db.winner).toEqual(enums.game_winner.PLAYER);
      expect(res.body.message).toEqual('Action: deal was done successfully');
      expect(res.body.success).toEqual(true);
      expect(res.body.data.winner).toEqual(enums.game_winner.PLAYER);
    });
  });

  describe('POST /game/:game_id/hit', () => {
    let random_table_hand;
    let random_deck;
    beforeEach(async () => {
      random_table_hand_data = await TestHelpers.generate_random_table_hand({
        user_id: user.dataValues.id,
        game_id: game.id,
      });
      random_deck = await Deck.create(
        await TestHelpers.generate_random_deck({ game_id: game.id })
      );
      random_table_hand = await TableHand.create(random_table_hand_data);
    });
    it('should add one card to the player', async () => {
      const res = await request(app)
        .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send()
        .expect(200);
      expect(res.body.message).toEqual('Action: hit was done successfully');
      expect(res.body.success).toEqual(true);

      const table_hand = await TableHand.findByPk(random_table_hand.id);
      expect(table_hand.player_cards.length).toEqual(
        random_table_hand.player_cards.length + 1
      );
      expect(res.body.data.player.cards.length).toEqual(
        random_table_hand.player_cards.length + 1
      );
      expect(res.body.data.dealer.cards.length).toEqual(
        random_table_hand.dealer_cards.length
      );
    });

    describe('player hand is busted', () => {
      beforeEach(async () => {
        await random_table_hand.update({
          player_cards: [
            {
              id: 'Kc',
              rank: '13',
              value: '10',
              suit: 'clubs',
              second_value: null,
            },
            {
              id: 'Jc',
              rank: '11',
              value: '10',
              suit: 'clubs',
              second_value: null,
            },
            {
              id: '1c',
              rank: '1',
              value: '1',
              suit: 'clubs',
              second_value: null,
            },
          ],
        });
      });
      it('it should return player data object, with is_busted = true , points > 21, dealer winner', async () => {
        const res = await request(app)
          .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
          .set('Authorization', `Bearer ${user.access_token}`)
          .send({ test: 'test' })
          .expect(200);

        expect(res.body.message).toEqual('Action: hit was done successfully');
        expect(res.body.success).toEqual(true);
        expect(res.body.data.player.cards.length).toEqual(
          random_table_hand.player_cards.length + 1
        );
        expect(res.body.data.dealer.cards.length).toEqual(
          random_table_hand.dealer_cards.length
        );

        expect(res.body.data.player.is_busted).toBeTruthy();
        expect(res.body.data.player.points).toBeGreaterThan(21);
        expect(res.body.data.winner).toEqual(enums.game_winner.DEALER);
      });
      it('should update game, deck, table_hand', async () => {
        const res = await request(app)
          .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
          .set('Authorization', `Bearer ${user.access_token}`)
          .send({ test: 'test' })
          .expect(200);

        const table_hand_db = await TableHand.findByPk(random_table_hand.id);
        const deck_db = await Deck.findByPk(random_deck.id);
        const game_db = await Game.findByPk(game.id);

        expect(table_hand_db.dataValues.winner).toEqual(
          enums.game_winner.DEALER
        );
        expect(table_hand_db.dataValues.player_points).toBeGreaterThan(21);

        expect(deck_db.dataValues.cards.length).not.toBeGreaterThanOrEqual(
          random_deck.cards.length
        );

        expect(+game_db.dataValues.house_balance_fluctuation).toEqual(
          +random_table_hand.bet_value
        );
        expect(-(-game_db.dataValues.user_balance_fluctuation)).toEqual(
          -random_table_hand.bet_value
        );
      });
    });

    it('should return and save in db player win, if play have 21 points and dealer not 21', async () => {
      await random_table_hand.update({
        player_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
          {
            id: 'Jc',
            rank: '11',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
        dealer_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
      });

      random_deck.update({
        cards: [
          {
            id: '1c',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
          {
            id: 'Jh',
          },
        ],
      });

      const res = await request(app)
        .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ test: 'test' })
        .expect(200);

      const hand_table_db = await TableHand.findByPk(random_table_hand.id);

      expect(res.body.data.winner).toEqual(enums.game_participants.PLAYER);
      expect(hand_table_db.winner).toEqual(enums.game_participants.PLAYER);
    });
    it('should return and save in db WINNER = PLAYER, if player have 21 points and dealer not 21', async () => {
      await random_table_hand.update({
        player_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
          {
            id: 'Jc',
            rank: '11',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
        dealer_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
      });

      random_deck.update({
        cards: [
          {
            id: '1c',
          },
          {
            id: 'Jh',
          },
        ],
      });

      const res = await request(app)
        .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ test: 'test' })
        .expect(200);

      const hand_table_db = await TableHand.findByPk(random_table_hand.id);
      expect(res.body.data.winner).toEqual(enums.game_winner.PLAYER);
      expect(hand_table_db.winner).toEqual(enums.game_winner.PLAYER);
    });
    it('should return and save in db WINNER = DRAW, if player have 21 points and dealer 21', async () => {
      await random_table_hand.update({
        player_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
          {
            id: 'Jc',
            rank: '11',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
        dealer_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
      });

      random_deck.update({
        cards: [
          {
            id: '1c',
          },
          {
            id: '1c',
          },
        ],
      });

      const res = await request(app)
        .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ test: 'test' })
        .expect(200);

      const hand_table_db = await TableHand.findByPk(random_table_hand.id);

      expect(res.body.data.winner).toEqual(enums.game_winner.DRAW);
      expect(hand_table_db.winner).toEqual(enums.game_winner.DRAW);
    });
    it('should return and save in db WINNER = DRAW, if player have 21 points and dealer 21', async () => {
      await random_table_hand.update({
        player_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
          {
            id: 'Jc',
            rank: '11',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
        dealer_cards: [
          {
            id: 'Kc',
            rank: '13',
            value: '10',
            suit: 'clubs',
            second_value: null,
          },
        ],
      });

      random_deck.update({
        cards: [
          {
            id: '1c',
          },
          {
            id: '1c',
          },
        ],
      });

      const res = await request(app)
        .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send({ test: 'test' })
        .expect(200);

      const hand_table_db = await TableHand.findByPk(random_table_hand.id);

      expect(res.body.data.winner).toEqual(enums.game_winner.DRAW);
      expect(hand_table_db.winner).toEqual(enums.game_winner.DRAW);
    });
    it('should update table_hand', async () => {
      const res = await request(app)
        .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send()
        .expect(200);
    });
    // finish tests
  });

  describe('POST /game/game_id/stand', () => {
    let res;
    beforeEach(async () => {
      random_table_hand_data = await TestHelpers.generate_random_table_hand({
        user_id: user.dataValues.id,
        game_id: game.id,
      });

      random_table_hand = await TableHand.create(random_table_hand_data);
      const res = await request(app)
        .post(`/v1/game/${game.id}/stand?&hand_id=${random_table_hand.id}`)
        .set('Authorization', `Bearer ${user.access_token}`)
        .send()
        .expect(400);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should create a new handutils class', async () => {
      //implement it
    });
    it('should call dealer play to make the play of dealer', async () => {
      //implement it
    });
    it('should check who won', async () => {
      //implement it
    });
    it('should call TableHand.finish_hand', async () => {
      //implement it
    });
    it('should return the payload with the winner', async () => {
      //implement it
    });
  });
});
