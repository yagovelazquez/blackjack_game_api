const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const config = require('../config');

module.exports = (sequelize) => {
  class User extends Model {
    static async hashPassword(password) {
      return bcrypt.hash(password, config.saltRounds);
    }
    static associate (models) {
      User.hasMany(models.Game, { foreignKey: "user_id", as: "games" });
      User.hasMany(models.TableHand, { foreignKey: "user_id", as: "table_hands" });
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Not a valid email address',
          },
          notNull: {
            msg: 'Email is required',
          },
        },
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          isDecimal: {
            msg: 'Balance has to be a decimal value'
          },
          notNull: {
            msg: 'Balance is required'
          }
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Password can not be blank',
          },
        },
      },
      username: {
        type: DataTypes.STRING(50),
        unique: true,
        validate: {
          len: {
            args: [2, 50],
            msg: 'Username must contain between 2 and 50 characters',
          },
        },
      },
      name: {
        type: DataTypes.STRING(50),
        validate: {
          len: {
            args: [3, 50],
            msg: 'Name must contain between 3 and 50 characters',
          },
        },
      },
    },
    {
      sequelize,
      validate: true,
      modelName: 'User',
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
    }
  );

  User.prototype.comparePasswords = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.beforeSave(async (user, options) => {
    if (user.password) {
      const hashedPassword = await User.hashPassword(user.password);
      user.password = hashedPassword;
    }
  });

  User.afterCreate((user, options) => {
    delete user.dataValues.password;
  });

  return User;
};
