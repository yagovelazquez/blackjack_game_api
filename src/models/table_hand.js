const { Model, DataTypes } = require('sequelize');
const enums = require('../enum');
const { models } = require('.');
const HandUtils = require('../utils/hand_utils');
const { Deck } = models;

module.exports = (sequelize) => {
  class TableHand extends Model {
    static associate(models) {
      TableHand.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
    static associate(models) {
      TableHand.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    }
  }

  TableHand.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      player_cards: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      dealer_cards: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      player_points: {
        type: DataTypes.INTEGER,
        validate: {
          min: {
            args: [0],
            msg: 'TableHand.player_points must be higher than 0',
          },
        },
      },
      winner: {
        type: DataTypes.ENUM(...Object.values(enums.game_winner)),
        allowNull: true,
      },
      dealer_points: {
        type: DataTypes.INTEGER,
        validate: {
          min: {
            args: [0],
            msg: 'TableHand.dealer_points must be higher than 0',
          },
        },
      },
      game_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bet_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          greaterThanZero(value) {
            if (value <= 0) {
              throw new Error('Value must be greater than 0.');
            }
          },
        },
      },
    },
    {
      sequelize,
      validate: true,
      modelName: 'TableHand',
    }
  );

  return TableHand;
};
