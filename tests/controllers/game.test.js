const request = require('supertest')
const TestHelpers = require("../helpers/test_helpers");
const { models } = require('../../src/models');

describe('game', () => {
    let user;
    let app;
    let Game;
    beforeAll(async () => {
      await TestHelpers.start_db();
      app = TestHelpers.get_app();
      Game = models.Game
    });
    afterAll(async () => {
      await TestHelpers.stop_db();
    });
    beforeEach(async () => {
      await TestHelpers.sync_db();
      user = await TestHelpers.create_user_and_get_token(app)
    });
    it('should create a game and store in database', async () => {
        const res = await request(app)
        .post('/v1/game/start')
        .set('Authorization', `Bearer ${user.access_token}`)
        .expect(200);
        expect(res.body.message).toEqual('Game successfully started');
        expect(res.body.success).toEqual(true);
    })
    it('should return status 401 if user not logged in', async () => {
        const res = await request(app)
        .post('/v1/game/start')
        .set('Authorization', `Bearer 123`)
        .expect(401);
        expect(res.body.message).toEqual('Invalid token');
        expect(res.body.success).toEqual(false);
    })
})