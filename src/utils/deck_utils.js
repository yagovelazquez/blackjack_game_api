const _ = require('lodash');
const { models } = require('../models');
const { Op } = require('sequelize');

const { Card } = models;

class DeckUtils {
  constructor(deck) {
    this.deck = deck || [];
  }

  async create_shuffled_deck({ deck_count }) {
    if (deck_count <= 0) {
      throw new Error('Invalid deck_count. Must be greater than 0.');
    }
    const all_db_cards = await Card.findAll({
      raw: true,
      attributes: ['id'],
    });

    this.deck = _.flatten(_.times(deck_count, () => all_db_cards));
    this.shuffle();

    return this.deck;
  }

  shuffle() {
    if (!this.deck || this.deck.length === 0) {
      throw new Error('Deck is not defined or empty. Cannot shuffle.');
    }
    this.deck = _.shuffle(this.deck);
    return this.deck;
  }
}

module.exports = DeckUtils;
