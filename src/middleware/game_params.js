const { models } = require('../models');
const ControllerUtils = require('../utils/controller_utils');
const JWTUtils = require('../utils/jwt_utils');
const enums = require('../enum');

const { User, Deck, Game, TableHand } = models;
function game_params(check_models = ['user', 'deck', 'game', 'table_hand']) {
  return async function (req, res, next) {
    const { jwt } = req.body;
    const game_id = req.params.game_id;
    const hand_id = req.query.hand_id;
    if (check_models.includes('user')) {
      const user = await User.findByPk(jwt.user_id);
      if (!user) {
        return ControllerUtils.send_error_response({
          res,
          message: 'User was not found',
        });
      }
      req.body.user = user;
    }
    let game;
    if (check_models.includes('game')) {
      game = await Game.findByPk(game_id, {
        include: {
          model: Deck,
          as: 'deck',
        },
      });
      if (!game) {
        return ControllerUtils.send_error_response({
          res,
          message: 'Game was not found',
        });
      }
      if (game.status === enums.game_status.COMPLETED) {
        return ControllerUtils.send_error_response({
          res,
          message: 'Game is already completed',
        });
      }
      req.body.game = game;
    }
    if (check_models.includes('deck')) {
      const deck = game.deck;
      if (!deck) {
        return ControllerUtils.send_error_response({
          res,
          message: 'Deck was not found',
        });
      }
      req.body.deck = deck;
    }
    if (check_models.includes('table_hand')) {
      const table_hand = await TableHand.findByPk(hand_id);
      if (!table_hand) {
        return ControllerUtils.send_error_response({
          res,
          message: 'Table hand was not found',
        });
      }
      if (table_hand.winner) {
        return ControllerUtils.send_error_response({
          res,
          message: 'This table hand already have finished',
        });
      }
      req.body.table_hand = table_hand;
    }
    next();
  };
}

module.exports = game_params;
