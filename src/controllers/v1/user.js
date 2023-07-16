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
      const accessToken = JWTUtils.generateAccessToken(payload);

      return res.status(200).send({
        success: true,
        message: 'User successfully registered',
        data: { accessToken },
      });
    } catch (err) {
      return res.status(400).send({
        success: false,
        message: err.message,
      });
    }
  }
}

router.post('/user/register', UserController.register);

module.exports = router;
