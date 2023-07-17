const { Router } = require('express');
const { models } = require('../../models');
const JWTUtils = require('../../utils/jwt_utils');

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
        data: { access_token },
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

      return res.status(200).send({
        success: true,
        message: 'User successfully registered',
        data: { access_token },
      });
  }
}

router.post('/user/register', UserController.register);
router.post('/user/login', UserController.login);

module.exports = router;
