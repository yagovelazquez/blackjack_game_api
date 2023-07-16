const request = require('supertest');
const { models } = require('../../src/models');
const TestHelpers = require('../test_helpers');

//TODO add restrictions on application level rather than just relying on database

describe('register', () => {
  let app;
  beforeAll(async () => {
    await TestHelpers.start_db();
    app = TestHelpers.get_app();
  });
  afterAll(async () => {
    await TestHelpers.stop_db();
  });
  beforeEach(async () => {
    await TestHelpers.sync_db();
  });
  it('should successfully create an account', async () => {
    const { User } = models;
    const fake_user = TestHelpers.generate_random_user();
    const res = await request(app).post('/v1/user/register').send(fake_user).expect(200);
    const users = await User.findAll({
      where: {
        email: fake_user.email,
      },
    });
    expect(res.body.data).toHaveProperty('accessToken')
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.message).toEqual('User successfully registered')
    expect(res.body.success).toEqual(true)
    expect(users.length).toEqual(1);
    expect(users[0]).not.toBeNull();
    expect(users[0].email).toEqual(fake_user.email);
    expect(users[0].password).toBeUndefined();
    expect(users[0].username).toEqual(fake_user.username);
    expect(users[0].name).toEqual(fake_user.name);
  });

  it('should respond with a 400 error and an error message if a database constraint is violated', async () => {
    const { User } = models;
    const fake_user = TestHelpers.generate_random_user({ email: 'test' });
    const response = await request(app).post('/v1/user/register').send(fake_user).expect(400);
    const users = await User.findAll();
    expect(users.length).toEqual(0);
    expect(response.body.message).toEqual('Validation error: Not a valid email address')
  })

});
