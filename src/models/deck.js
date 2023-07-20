const { Model, DataTypes } = require('sequelize');
const enums = require('../enum');
const _ = require('lodash')

module.exports = (sequelize) => {
  class Deck extends Model {
    static associate(models) {
      Deck.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
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

  Deck.beforeSave((instance) => {
    instance.cards = _.shuffle(instance.cards);
  });

  return Deck;
};
