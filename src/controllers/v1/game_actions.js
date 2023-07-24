const { Router } = require('express');
const auth = require('../../middleware/auth');
const { models } = require('../../models');
const _ = require('lodash');
const HandUtils = require('../../utils/hand_utils');
const game_params = require('../../middleware/game_params');
const enums = require('../../enum');

const router = Router();
const { Game, User, TableHand, Deck } = models;

class GameActions {
  static async deal(req, res) {
    const { jwt, bet_value, user, game } = req.body;
    const game_id = game.id;

    if (user.balance - bet_value < 0) {
      return res.status(400).send({
        success: false,
        message: 'Your balance is too low',
      });
    }

    await user.update({ balance: user.balance - bet_value });

    const user_id = user.id;

    const new_deck = await Deck.create_shuffled_deck({
      game_id,
      deck_count: 4,
    });

    const hand_utils = new HandUtils({ deck: new_deck });
    await hand_utils.deal_card({
      card_quantity: 1,
      participant: enums.game_participants.DEALER,
    });
    await hand_utils.deal_card({
      card_quantity: 2,
      participant: enums.game_participants.PLAYER,
    });

    const table_hand = await TableHand.create({
      game_id,
      dealer_cards: hand_utils[enums.game_participants.DEALER].cards,
      player_cards: hand_utils[enums.game_participants.PLAYER].cards,
      dealer_points: hand_utils[enums.game_participants.DEALER].points,
      player_points: hand_utils[enums.game_participants.PLAYER].points,
      user_id,
      bet_value,
    });

    hand_utils.set_properties({ table_hand, game, user, deck: new_deck });
    await hand_utils.handle_player_21_points();
    await hand_utils.save_instances();

    console.log(hand_utils.player)

    return res.status(200).send({
      success: true,
      message: 'Action: deal was done successfully',
      data: {
        dealer: hand_utils.dealer,
        player: hand_utils.player,
        table_hand_id: table_hand.id,
        winner: hand_utils.winner,
      },
    });
  }

  static async hit(req, res) {
    const { game, user, table_hand, deck } = req.body;
    const hand_utils = new HandUtils({ table_hand, game, user, deck });

    await hand_utils.deal_card({
      card_quantity: 1,
      participant: enums.game_participants.PLAYER,
    });

    
    table_hand.player_cards = hand_utils.player.cards;
    table_hand.dealer_points = hand_utils.dealer.points;
    table_hand.player_points = hand_utils.player.points;
    await table_hand.save();

    if (hand_utils.player.is_busted) {
      hand_utils.check_who_won_hand()
      await TableHand.finish_hand({
        game,
        table_hand,
        winner: enums.game_winner.DEALER,
        user,
      });

      return res.status(200).send({
        success: true,
        message: 'Action: hit was done successfully',
        data: {
          dealer: {
            cards: hand_utils.dealer.cards,
            points: hand_utils.dealer.points,
            is_busted: hand_utils.dealer.is_busted
          },
          player: {
            cards: hand_utils.player.cards,
            points: hand_utils.player.points,
            is_busted: hand_utils.player.is_busted
          },
          table_hand_id: table_hand.id,
          winner: hand_utils.winner,
        },
      });
    }

    await hand_utils.handle_player_21_points();
    await hand_utils.save_instances();

    return res.status(200).send({
      success: true,
      message: 'Action: hit was done successfully',
      data: {
        dealer: {
          cards: hand_utils.dealer.cards,
          points: hand_utils.dealer.points,
        },
        player: {
          cards: hand_utils.player.cards,
          points: hand_utils.player.points,
        },
        table_hand_id: table_hand.id,
        winner: hand_utils.winner,
      },
    });
  }

  static async stand(req,res) {
    const { game, user, table_hand, deck } = req.body;
    const hand_utils = new HandUtils({ table_hand, game, user, deck });

    hand_utils.dealer_play()
    hand_utils.check_who_won_hand()

    await TableHand.finish_hand({
      game,
      table_hand,
      winner: hand_utils.winner,
      user,
    });

    return res.status(200).send({
      success: true,
      message: 'Action: stand was done successfully',
      data: {
        dealer: {
          cards: hand_utils.dealer.cards,
          points: hand_utils.dealer.points,
        },
        player: {
          cards: hand_utils.player.cards,
          points: hand_utils.player.points,
        },
        table_hand_id: table_hand.id,
        winner: hand_utils.winner,
      },
    });
  }
}

router.post(
  '/game/:game_id/deal',
  auth((token_type = 'access_token')),
  game_params(['user', 'game']),
  GameActions.deal
);

router.post(
  '/game/:game_id/hit',
  auth((token_type = 'access_token')),
  game_params(),
  GameActions.hit
);

router.post(
  '/game/:game_id/stand',
  auth((token_type = 'access_token')),
  game_params(),
  GameActions.stand
);

module.exports = router;
