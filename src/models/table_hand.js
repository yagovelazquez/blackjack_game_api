const { Model, DataTypes } = require('sequelize');
const enums = require('../enum');

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
      },
      game_id: {
        type: DataTypes.INTEGER,
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
