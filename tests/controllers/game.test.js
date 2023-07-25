const request = require('supertest');
const TestHelpers = require('../helpers/test_helpers');
const { models } = require('../../src/models');
const ModelTestHelper = require('../helpers/model_test_helper');
const enums = require('../../src/enum');

describe('game', () => {
  let app;
  let Game;
  let access_token;
  beforeAll(async () => {
    await TestHelpers.start_db();
    app = TestHelpers.get_app();
    Game = models.Game;
  });
  afterAll(async () => {
    await TestHelpers.stop_db();
  });
  beforeEach(async () => {
    await TestHelpers.sync_db();
    const user = await TestHelpers.create_user_and_get_token(app);
    access_token = user.access_token;
  });
  describe('POST game/start', () => {
    it('should create a game and store in database', async () => {
      const res = await request(app)
        .post('/v1/game/start')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);
      expect(res.body.message).toEqual('Game successfully started');
      expect(res.body.success).toEqual(true);
    });
    it('should return status 401 if user not logged in', async () => {
      const res = await request(app)
        .post('/v1/game/start')
        .set('Authorization', `Bearer 123`)
        .expect(401);
      expect(res.body.message).toEqual('Invalid token');
      expect(res.body.success).toEqual(false);
    });
  });
  describe('POST game/finish', () => {
    it('should finish the game', async () => {
      const game_test_helper = new ModelTestHelper('Game');
      const game_instance = await game_test_helper.create();

      const res = await request(app)
        .post(`/v1/game/${game_instance.dataValues.id}/finish`)
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);
      expect(res.body.message).toEqual('Game is now finished');
      expect(res.body.success).toEqual(true);

      const updated_game = await Game.findByPk(game_instance.dataValues.id);
      expect(updated_game.status).toEqual(enums.game_status.COMPLETED);
    });
    it('if game does not exists should return 400', async () => {
      const res = await request(app)
        .post(`/v1/game/test/finish`)
        .set('Authorization', `Bearer ${access_token}`)
        .expect(400);
      expect(res.body.message).toEqual('Game was not found');
    });
  });
});
