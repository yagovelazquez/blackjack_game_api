const { models } = require('../../src/models');
const randomstring = require('randomstring');
const TestHelpers = require('../helpers/test_helpers')

describe('User model', () => {
  beforeAll(async () => {
    await TestHelpers.start_db();
  });

  afterAll(async () => {
    await TestHelpers.stop_db();
  });

  beforeEach(async () => {
    await TestHelpers.sync_db();
  });

  describe('instance methods', () => {
    it('should create a new user and store in database', async () => {
      const { User } = models;
      const fake_user = TestHelpers.generate_random_user();
      const new_user = await User.create(fake_user);
      expect(new_user).not.toBeNull();
      expect(new_user.email).toEqual(fake_user.email);
      expect(new_user.password).toBeUndefined();
      expect(new_user.username).toEqual(fake_user.username);
      expect(new_user.name).toEqual(fake_user.name);
      expect(new_user.balance).toEqual(fake_user.balance);
    });

    describe('comparePasswords', () => {
      let password = 'Test123#';
      let user;

      beforeEach(async () => {
        user = await TestHelpers.create_new_user({ password });
      });

      it('should return true if the password is correct', async () => {
        const { User } = models;
        const userFound = await User.scope('withPassword').findByPk(user.id);
        const isPasswordCorrect = await userFound.comparePasswords(password);
        expect(isPasswordCorrect).toEqual(true);
      });

      it('should return false if the password is incorrect', async () => {
        const { User } = models;
        const userFound = await User.scope('withPassword').findByPk(user.id);
        const isPasswordCorrect = await userFound.comparePasswords(
          'invalidpassword'
        );
        expect(isPasswordCorrect).toEqual(false);
      });
    });
  });

  describe('static method', () => {
    it('should returned a hashed password', async () => {
      const { User } = models;
      const password = 'test1234';
      const hashed_password = await User.hashPassword(password);
      expect(hashed_password).not.toEqual(password);
    });
  });

  describe('email property', () => {
    it('should return a validate error if is not a valid email address', async () => {
      const fake_user = { email: 'test' };
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Not a valid email address',
      });
    });

    it('should return a validate error if the email is null', async () => {
      const fake_user = { email: null };
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Email is required',
      });
    });

    it('email validation: should return a validate error if the email already exists', async () => {
      const { User } = models;
      const fake_user = TestHelpers.generate_random_user();
      await User.create(fake_user);
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'email must be unique',
      });
    });
  });

  describe('balance property', () => {
    it('should return a validation error if the balance is not a decimal value', async () => {
      const fake_user = { balance: 'string' };
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Balance has to be a decimal value',
      });
    });

    it('should return a validation error if the balance null', async () => {
      const fake_user = { balance: null };
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Balance is required',
      });
    });

    it('should default to 0 if no value provided', async () => {
      const { User } = models;
      const fake_user = TestHelpers.generate_random_user();
      delete fake_user.balance;
      const user = await User.create(fake_user);
      expect(user.balance).toEqual(0);
    });
  });
  describe('password property', () => {
    it('should convert the password to be hashed before storing in DB', async () => {
      const { User } = models;
      const fake_user = TestHelpers.generate_random_user();
      const user = await User.create(fake_user);
      expect(user.password).not.toEqual(fake_user.password);
    });

    it('should delete password from datavalues', async () => {
      const user = await TestHelpers.create_new_user();
      expect(user.dataValues.password).toBeUndefined();
    });

    it('should not allow blank/empty passwords', async () => {
      const fake_user = { password: '' };
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Password can not be blank',
      });
    });

    it('should not allow null passwords', async () => {
      const fake_user = { password: null };
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'User.password cannot be null',
      });
    });
  });
  describe('username property', () => {
    it('should be unique', async () => {
      const { User } = models;
      const fake_user = TestHelpers.generate_random_user({
        email: 'test2@gmail.com',
      });
      await User.create(fake_user);
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: undefined,
        error_message: 'username must be unique',
      });
    });
    it('should be equal or smaller than 50 characters', async () => {
      const fake_user = TestHelpers.generate_random_user({
        username: randomstring.generate(51),
      });
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Username must contain between 2 and 50 characters',
      });
    });
    it('should be equal or greater than 2 characters', async () => {
      const fake_user = TestHelpers.generate_random_user({
        username: randomstring.generate(1),
      });
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Username must contain between 2 and 50 characters',
      });
    });
  });

  describe('name property', () => {
    it('should be equal or smaller than 50 characters', async () => {
      const fake_user = TestHelpers.generate_random_user({
        name: randomstring.generate(51),
      });
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Name must contain between 3 and 50 characters',
      });
    });
    it('should be equal or greater than 3 characters', async () => {
      const fake_user = TestHelpers.generate_random_user({
        name: randomstring.generate(2),
      });
      await TestHelpers.test_user_model_validation_error({
        random_user_obj: fake_user,
        error_message: 'Name must contain between 3 and 50 characters',
      });
    });
  });
});
