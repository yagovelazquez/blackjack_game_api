const { card_rank, card_suit } = require('../../enum');
const enums = require('../../enum');
const { models } = require('../../models');

const get_all_cards = () => {
  const { Card } = models
  const seed_data = [];
  for (const suit in enums.card_suit) {
    for (const rank in enums.card_rank) {
      let value = parseInt(rank, 10);
      let second_value = null;
      if (value > 10) {
        value = 10;
      }
      if (value === 1) {
        second_value = 11;
      }
      const id = Card.generate_id(card_rank[rank], card_suit[suit]);
      seed_data.push({
        id,
        rank: enums.card_rank[rank],
        suit: enums.card_suit[suit],
        value: value,
        second_value,
      });
    }
  }
  return seed_data;
};

module.exports = get_all_cards;
