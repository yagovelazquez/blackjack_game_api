const { Model, DataTypes } = require('sequelize');
const enums = require('../enum');
const _ = require('lodash');
const DeckUtils = require('../utils/deck_utils');
const Lib = require('../utils/lib');

module.exports = (sequelize) => {
  class Deck extends Model {
    static associate(models) {
      Deck.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    }

    static async create_shuffled_deck({ game_id, deck_count }) {
      Lib.throw_error_not_positive_numbers(deck_count, 'deck_count');

      const deck_utils = new DeckUtils();
      await deck_utils.create_shuffled_deck({ deck_count });

      return await Deck.create({
        game_id,
        cards: deck_utils.deck,
      });
    }
  }

  Deck.init(
    {
      cards: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      game_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      validate: true,
      modelName: 'Deck',
      timestamps: false,
    }
  );

  return Deck;
};
