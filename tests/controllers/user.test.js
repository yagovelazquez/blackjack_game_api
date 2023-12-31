const request = require('supertest');
const { models } = require('../../src/models');
const JWTUtils = require('../../src/utils/jwt_utils');
const TestHelpers = require('../helpers/test_helpers');

//TODO add restrictions on application level rather than just relying on database

describe('user', () => {
  let User;
  let app;
  beforeAll(async () => {
    await TestHelpers.start_db();
    app = TestHelpers.get_app();
    User = models.User;
  });
  afterAll(async () => {
    await TestHelpers.stop_db();
  });
  beforeEach(async () => {
    await TestHelpers.sync_db();
  });
  describe('POST /register', () => {
    it('should successfully create an account', async () => {
      const fake_user = TestHelpers.generate_random_user();
      const res = await request(app)
        .post('/v1/user/register')
        .send(fake_user)
        .expect(200);
      const users = await User.findAll({
        where: {
          email: fake_user.email,
        },
      });
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data.access_token).toBeDefined();
      const access_token = res.body.data.access_token;
      const payload = JWTUtils.verify_access_token(access_token);
      expect(payload).toHaveProperty('user_id');
      expect(res.body.message).toEqual('User successfully registered');
      expect(res.body.success).toEqual(true);
      expect(users.length).toEqual(1);
      expect(users[0]).not.toBeNull();
      expect(users[0].email).toEqual(fake_user.email);
      expect(users[0].password).toBeUndefined();
      expect(users[0].username).toEqual(fake_user.username);
      expect(users[0].name).toEqual(fake_user.name);
    });

    it('should respond with a 400 error and an error message if a database constraint is violated', async () => {
      const fake_user = TestHelpers.generate_random_user({ email: 'test' });
      const response = await request(app)
        .post('/v1/user/register')
        .send(fake_user)
        .expect(400);
      const users = await User.findAll();
      expect(users.length).toEqual(0);
      expect(response.body.message).toEqual(
        'Validation error: Not a valid email address'
      );
    });
  });
  describe('POST /login', () => {
    it('should return a token access with valid credentials', async () => {
      const fake_user = TestHelpers.generate_random_user();
      const user = await User.create(fake_user);
      const res = await request(app)
        .post('/v1/user/login')
        .send(fake_user)
        .expect(200);
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.message).toEqual('User successfully registered');
      expect(res.body.success).toEqual(true);
      const payload = JWTUtils.verify_access_token(res.body.data.access_token);
      expect(payload).toHaveProperty('user_id');
      expect(payload.user_id).toEqual(user.id);
    });

    it('should return a invalid credentials if email does not exist', async () => {
      const fake_user = TestHelpers.generate_random_user();
      const res = await request(app)
        .post('/v1/user/login')
        .send(fake_user)
        .expect(401);
      expect(res.body.message).toEqual('Invalid credentials');
      expect(res.body.success).toEqual(false);
    });
    it('should return a invalid credentials if password is wrong', async () => {
      const fake_user = TestHelpers.generate_random_user();
      await User.create(fake_user);
      fake_user.password = ''
      const res = await request(app)
        .post('/v1/user/login')
        .send(fake_user)
        .expect(401);
      expect(res.body.message).toEqual('Invalid credentials');
      expect(res.body.success).toEqual(false);
    });
  });
});
