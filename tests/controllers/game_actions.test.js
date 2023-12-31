const request = require('supertest');
const TestHelpers = require('../helpers/test_helpers');
const { models } = require('../../src/models');
const ModelTestHelper = require('../helpers/model_test_helper');
const { get_all_cards } = require('../../src/database/function_seeders/cards');
const enums = require('../../src/enum');
const MockModelFunctions = require('../helpers/mock/mock_model_functions');
const HandUtils = require('../../src/utils/hand_utils');
const GameActionHelper = require('../helpers/controllers/game_action_helper');

describe('game_actions', () => {
  let user,
    app,
    Game,
    game,
    res,
    User,
    bet_value,
    Deck,
    TableHand,
    mock_deck_model,
    game_action_controller_helper;

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
    beforeEach(() => {
      bet_value = 30;
      game_action_controller_helper = new GameActionHelper({
        app,
        url: `/v1/game/${game.id}/deal`,
        headers: ['Authorization', `Bearer ${user.access_token}`],
        data: { bet_value },
      });
    });
    it('should return dealer data, player data, winner as undefined, and table hand id', async () => {
      mock_deck_model.create();
      const res = await game_action_controller_helper.request();
      expect(res.body.message).toEqual('Action: deal was done successfully');
      expect(res.body.success).toEqual(true);
      GameActionHelper.test_data_object_is_in_res(res);
    });
    it('should update users balance', async () => {
      mock_deck_model.create();
      await game_action_controller_helper.request();
      const updated_user = await User.findByPk(user.dataValues.id);
      expect(updated_user.balance).toEqual(
        (user.dataValues.balance - bet_value).toFixed(2)
      );
    });
    it('should create a new shuffled deck, with around 210 cards', async () => {
      const spy_shuffled_deck = jest.spyOn(Deck, 'create_shuffled_deck');
      await game_action_controller_helper.request();
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
      mock_deck_model.create();
      await game_action_controller_helper.request();
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
      game_action_controller_helper.headers = [
        'Authorization',
        `Bearer ${user2.access_token}`,
      ];

      const res = await game_action_controller_helper.request({
        expected_status: 400,
      });
      expect(res.body.message).toEqual('User was not found');
      expect(res.body.success).toEqual(false);
    });

    it('should return 400 if balance < bet_value', async () => {
      const res = await game_action_controller_helper.request({
        data: { bet_value: user.dataValues.balance + 1 },
        expected_status: 400,
      });
      expect(res.body.message).toEqual('Your balance is too low');
      expect(res.body.success).toEqual(false);
    });
    it('should return 400 if game not found', async () => {
      game_action_controller_helper.url = '/v1/game/200/deal'
      const res = await game_action_controller_helper.request({
        expected_status: 400,
      });
      expect(res.body.message).toEqual('Game was not found');
      expect(res.body.success).toEqual(false);
    });
    it('should return status 401 if user not logged in', async () => {
      game_action_controller_helper.headers = ['Authorization', `Bearer 123`]
      const res = await game_action_controller_helper.request({
        expected_status: 401,
      });
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

    describe('player_points < 21', () => {
      it('should return an object with dealer obj, player obj, table_hand_id and winner', async () => {
        await random_table_hand.update({
          player_cards: [
            {
              id: '1c',
              rank: '1',
              suit: 'clubs',
              value: '1',
              second_value: null,
            },
          ],
        });

        const res = await request(app)
          .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
          .set('Authorization', `Bearer ${user.access_token}`)
          .send()
          .expect(200);

        GameActionHelper.test_data_object_is_in_res(res);
      });
      it('should update table_hand', async () => {
        const res = await request(app)
          .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
          .set('Authorization', `Bearer ${user.access_token}`)
          .send()
          .expect(200);

        const table_hand_db = await TableHand.findByPk(random_table_hand.id);
        const deck_db = await Deck.findByPk(random_deck.id);
        const game_db = await Game.findByPk(game.id);

        expect(table_hand_db.winner).toBe(null);
        expect(table_hand_db.dataValues.player_points).not.toBeGreaterThanOrEqual(21);
        expect(+table_hand_db.dataValues.player_cards.length).toEqual(+random_table_hand.player_cards.length + 1)
        expect(table_hand_db.dataValues.dealer_cards.length).toEqual(random_table_hand.dealer_cards.length)

        expect(deck_db.dataValues.cards.length).not.toBeGreaterThanOrEqual(
          random_deck.cards.length
        );

        expect(+game_db.dataValues.house_balance_fluctuation).toEqual(
          0
        );
        expect(-(-game_db.dataValues.user_balance_fluctuation)).toEqual(
         0
        );
      });
    });

    describe('player hand is busted', () => {
      let res;
      beforeEach(async () => {
        await random_table_hand.update({
          player_cards: [
            {
              id: 'Kc',
              value: '10',
            },
            {
              id: 'Jc',
              value: '10',
            },
            {
              id: '1c',
              value: '1',
            },
          ],
        });
        res = await request(app)
          .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
          .set('Authorization', `Bearer ${user.access_token}`)
          .send()
          .expect(200);
      });
      it('it should return player data object, with is_busted = true , points > 21, dealer winner', async () => {
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

    describe('player 21 points', () => {
      beforeEach(async () => {
        await random_table_hand.update({
          player_cards: [
            {
              id: 'Kc',
              value: '10',
            },
            {
              id: 'Jc',
              value: '10',
            },
          ],
          dealer_cards: [
            {
              id: 'Kc',
              value: '10',
            },
          ],
        });
      });

      describe('winner = PLAYER', () => {
        let res;
        beforeEach(async () => {
          await random_deck.update({
            cards: [
              {
                id: '1c',
              },
              {
                id: 'Jh',
              },
            ],
          });
          res = await request(app)
            .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
            .set('Authorization', `Bearer ${user.access_token}`)
            .send()
            .expect(200);
        });
        it('should return WINNER = player', async () => {
          expect(res.body.data.winner).toEqual(enums.game_winner.PLAYER);
        });
        it('should update game, deck, table_hand, user', async () => {
          const table_hand_db = await TableHand.findByPk(random_table_hand.id);
          const deck_db = await Deck.findByPk(random_deck.id);
          const game_db = await Game.findByPk(game.id);
          const user_db = await User.findByPk(user.id);

          expect(table_hand_db.dataValues.winner).toEqual(
            enums.game_winner.PLAYER
          );
          expect(table_hand_db.dataValues.player_points).toEqual(21);

          expect(deck_db.dataValues.cards.length).not.toBeGreaterThanOrEqual(
            random_deck.cards.length
          );

          expect(+game_db.dataValues.house_balance_fluctuation).toEqual(
            -random_table_hand.bet_value
          );
          expect(+game_db.dataValues.user_balance_fluctuation).toEqual(
            +random_table_hand.bet_value
          );

          expect(+user_db.balance).toEqual(
            +user.balance + 2 * +random_table_hand.bet_value
          );
        });
      });

      describe('WINNER = DRAW, both 21 points', () => {
        beforeEach(async () => {
          await random_deck.update({
            cards: [
              {
                id: '1c',
              },
              {
                id: '1c',
              },
            ],
          });

          res = await request(app)
            .post(`/v1/game/${game.id}/hit?&hand_id=${random_table_hand.id}`)
            .set('Authorization', `Bearer ${user.access_token}`)
            .send()
            .expect(200);
        });
        it('should return and save in db WINNER = DRAW, if player have 21 points and dealer 21', async () => {
          expect(res.body.data.winner).toEqual(enums.game_winner.DRAW);
        });
        it('should update game, deck, table_hand, user', async () => {
          const table_hand_db = await TableHand.findByPk(random_table_hand.id);
          const deck_db = await Deck.findByPk(random_deck.id);
          const game_db = await Game.findByPk(game.id);
          const user_db = await User.findByPk(user.id);

          expect(table_hand_db.dataValues.winner).toEqual(
            enums.game_winner.DRAW
          );
          expect(table_hand_db.dataValues.player_points).toEqual(21);

          expect(deck_db.dataValues.cards.length).not.toBeGreaterThanOrEqual(
            random_deck.cards.length
          );

          expect(+game_db.dataValues.house_balance_fluctuation).toEqual(0);
          expect(+game_db.dataValues.user_balance_fluctuation).toEqual(0);

          expect(+user_db.balance).toEqual(
            +user.balance + +random_table_hand.bet_value
          );
        });
      });
    });
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
