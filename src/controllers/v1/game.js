const { Router } = require('express');
const auth = require('../../middleware/auth');
const game_params = require('../../middleware/game_params');
const { models } = require('../../models');
const JWTUtils = require('../../utils/jwt_utils');
const enums = require('../../enum');

const router = Router();
const { Game, User } = models;

class GameController {
  static async start(req, res) {
    const payload = req.body.jwt;
    const user = await User.findByPk(payload.user_id);

    const game = await Game.create({
      user_id: user.id,
      house_balance_fluctuation: 0,
      user_balance_fluctuation: 0,
      status: enums.game_status.IN_PROGRESS,
    });

    return res.status(200).send({
      success: true,
      message: 'Game successfully started',
      data: {
        id: game.dataValues.id,
      },
    });
  }

  static async finish(req, res) {
    const { game } = req.body;
    game.status = enums.game_status.COMPLETED;
    game.save();

    return res.status(200).send({
      success: true,
      message: 'Game is now finished',
    });
  }
}

router.post(
  '/game/start',
  auth((token_type = 'access_token')),
  GameController.start
);
router.post(
  '/game/:game_id/finish',
  auth((token_type = 'access_token')),
  game_params('game'),
  GameController.finish
);

module.exports = router;
