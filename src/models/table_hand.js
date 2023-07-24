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

    static async finish_hand({ game, table_hand, winner, user }) {
      //this logic should be replaced to the utils later
      if (winner === enums.game_winner.DEALER) {
        await game.update({
          house_balance_fluctuation: table_hand.bet_value,
          user_balance_fluctuation: - table_hand.bet_value,
        });
        await table_hand.update({winner: enums.game_winner.DEALER})
        return {
          player: {
            balance: user.balance,
          },
        };
      }
      if (winner === enums.game_winner.PLAYER) {
        await game.update({
          house_balance_fluctuation: - table_hand.bet_value,
          user_balance_fluctuation: table_hand.bet_value,
        });
        await table_hand.update({winner: enums.game_winner.PLAYER})
        const user_update_obj = {
          player: {
            balance: parseFloat(user.balance) + 2 * table_hand.bet_value,
          },
        };
        await user.update(user_update_obj.player);
        return user_update_obj;
      }

      if (winner === enums.game_winner.DRAW) {
        await table_hand.update({winner: enums.game_winner.DRAW})
        const user_update_obj = {
          player: {
            balance: parseFloat(user.balance) + parseFloat(table_hand.bet_value),
          },
        };

        await user.update(user_update_obj.player);
        return user_update_obj;
      }
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
