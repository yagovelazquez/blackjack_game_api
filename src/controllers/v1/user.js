const { Router } = require('express');
const auth = require('../../middleware/auth');
const { models } = require('../../models');
const JWTUtils = require('../../utils/jwt_utils');
const game_params = require('../../middleware/game_params');

const router = Router();
const { User } = models;

class UserController {
  static async register(req, res) {
    try {
      const newUser = await User.create({ ...req.body });
      const payload = { user_id: newUser.id };
      const access_token = JWTUtils.generateaccess_token(payload);

      return res.status(200).send({
        success: true,
        message: 'User successfully registered',
        data: { access_token, ...newUser.dataValues },
      });
    } catch (err) {
      return res.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }

  static async login(req, res) {
    const { password, email } = req.body;
    const user = await User.scope('withPassword').findOne({
      where: { email },
    });
    if (!user || !(await user.comparePasswords(password))) {
      return res
        .status(401)
        .send({ success: false, message: 'Invalid credentials' });
    }
    const payload = { user_id: user.id };
    const access_token = JWTUtils.generateaccess_token(payload);
    const { password: user_pass, ...restUser } = user.dataValues;

    return res.status(200).send({
      success: true,
      message: 'User successfully registered',
      data: { access_token, ...restUser },
    });
  }

  static async get_user(req, res) {
    const { user } = req.body;

    return res.status(200).send({
      success: true,
      message: 'User successfully registered',
      data: user ,
    });
  }
}

router.post('/user/register', UserController.register);
router.post('/user/login', UserController.login);
router.get(
  '/user/get',
  auth((token_type = 'access_token')),
  game_params(['user']),
  UserController.get_user
);

module.exports = router;
