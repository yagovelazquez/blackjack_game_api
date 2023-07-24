const _ = require('lodash');
const { models } = require('../models');
const { Op } = require('sequelize');
const enums = require('../enum');

class HandUtils {
  constructor({
    deck = { cards: [] },
    dealer = {},
    player = {},
    table_hand = {},
    game = {},
    user = {},
  } = {}) {
    this.deck = deck;
    this.game = game;
    this.user = user;
    this.table_hand = table_hand;

    this[enums.game_participants.DEALER] = {
      cards: table_hand.dealer_cards || [],
      points: table_hand.dealer_points || 0,
      is_busted: false,
      ...dealer,
    };
    this[enums.game_participants.PLAYER] = {
      cards: table_hand.player_cards || [],
      points: table_hand.player_points || 0,
      is_busted: false,
      ...player,
    };

    this.winner = undefined;
  }

  set_properties(props) {
    for (const key in props) {
      if (this.hasOwnProperty(key)) {
        this[key] = props[key];
      }
    }
  }

  is_busted({ participant }) {
    return this[participant].points > 21 ? true : false;
  }

  async handle_player_21_points() {
    this.count_points();

    if (this[enums.game_participants.PLAYER].points === 21) {
      await this.dealer_play();
      this.check_who_won_hand();
      await models.TableHand.finish_hand({
        game: this.game,
        table_hand: this.table_hand,
        user: this.user,
        winner: this.winner,
      });
    }
  }

  async save_instances() {
    if (!_.isEmpty(this.deck)) {
      await this.deck.save();
    }
    
    if (!_.isEmpty(this.game)) {
      await this.game.save();
    }
  
    if (!_.isEmpty(this.user)) {
      await this.user.save();
    }
  
    if (!_.isEmpty(this.table_hand)) {
      this.table_hand.dealer_cards = this.dealer.cards
      this.table_hand.dealer_points = this.dealer.points
      this.table_hand.player_cards = this.player.cards
      this.table_hand.player_points = this.player.points
      this.table_hand.winner = this.winner
      await this.table_hand.save();
    }
  }

  async dealer_play() {
    while (this.dealer.points < 17) {
      await this.deal_card({
        card_quantity: 1,
        participant: enums.game_participants.DEALER,
      });
      this.count_points();
    }
  }

  check_who_won_hand() {
    this.count_points();

    if (this.player.is_busted) {
      this.winner = enums.game_winner.DEALER;
      return;
    }
    if (this.dealer.is_busted) {
      this.winner = enums.game_winner.PLAYER;
      return;
    }
    if (this.dealer.points === this.player.points) {
      this.winner = enums.game_winner.DRAW;
      return;
    }
    if (this.dealer.points > this.player.points) {
      this.winner = enums.game_winner.DEALER;
      return;
    }
    if (this.player.points > this.dealer.points) {
      this.winner = enums.game_winner.PLAYER;
      return;
    }
  }

  count_points() {
    Object.values(enums.game_participants).forEach((participant) => {
      if (!Array.isArray(this[participant].cards)) {
        throw new Error('Provide a valid array');
      }
      let sum = 0;
      let num_aces = 0;

      for (const card of this[participant].cards) {
        if (card.value === enums.card_values.one) {
          num_aces++;
          continue;
        }
        sum += parseInt(card.value);
      }

      while (num_aces > 0) {
        num_aces--;
        if (sum + 11 > 21) {
          sum += 1;
          continue;
        }
        sum += 11;
      }

      this[participant].points = sum;
      this[participant].is_busted = this.is_busted({ participant });
    });
  }

  async deal_card({ card_quantity, participant }) {
    if (card_quantity <= 0) {
      throw new Error('Invalid card_quantity. It should be greater than 0.');
    }
    const dealt_cards = this.deck.cards.slice(0, card_quantity);
    const cards = await models.Card.findAll({
      where: {
        [Op.or]: dealt_cards,
      },
      raw: true,
    });

    this.deck.cards = this.deck.cards.slice(card_quantity);
    this[participant].cards.push(...cards);
    this.count_points();
    return cards;
  }
}

module.exports = HandUtils;
