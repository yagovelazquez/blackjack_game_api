const { Model, DataTypes } = require('sequelize');
const enums = require('../enum');

module.exports = (sequelize) => {
  class Game extends Model {
    static associate(models) {
      Game.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    }
  }

  Game.init(
    {
      status: {
        type: DataTypes.ENUM(
          enums.game_status.COMPLETED,
          enums.game_status.IN_PROGRESS
        ),
        allowNull: false,
        defaultValue: enums.game_status.IN_PROGRESS,
      },
      house_balance_fluctuation: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      user_balance_fluctuation: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
        user_id: {
        type: DataTypes.INTEGER,
      }
    },
    {
      sequelize,
      validate: true,
      modelName: 'Game',
      timestamps: true,
    }
  );

  Game.beforeSave((instance) => {
    instance.user_balance_fluctuation = -instance.house_balance_fluctuation;
  });

  return Game;
};
