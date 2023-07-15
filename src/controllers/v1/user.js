const { Router } = require('express');
const { models } = require('../../models');

const router = Router();
const { User } = models;

class UserController {
  static async register(req, res) {
    try {
      await User.create({ ...req.body });
    } catch (err) {
      console.log(err);
      return res.status(400).send({
        success: false,
        message: err.message,
      });
    }
    return res.status(200).send({
      success: true,
      message: 'User successfully registered',
    });
  }
}

router.post('/user/register', UserController.register);

module.exports = router;
