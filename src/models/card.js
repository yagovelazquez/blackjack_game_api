const { Model, DataTypes } = require('sequelize');
const enums = require('../enum');

module.exports = (sequelize) => {
  class Card extends Model {
    static async generate_id(rank, suit) {
      const valid_ranks = Object.values(enums.card_rank);
      const valid_suits = Object.values(enums.card_suit);

      if (!valid_ranks.includes(rank) || !valid_suits.includes(suit)) {
        throw new Error('Invalid rank or suit');
      }

      let idRank;
      if (rank === '10') {
        idRank = 'T';
      } else if (rank === '11') {
        idRank = 'J';
      } else if (rank === '12') {
        idRank = 'Q';
      } else if (rank === '13') {
        idRank = 'K';
      } else {
        idRank = rank.charAt(0);
      }
    
      const idSuit = suit.charAt(0);
      const id = idRank + idSuit;
    
      return id;
    }
  }

  Card.init(
    {
      id: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false,
      },
      rank: {
        type: DataTypes.ENUM(...Object.values(enums.card_rank)),
        allowNull: false,
      },
      suit: {
        type: DataTypes.ENUM(...Object.values(enums.card_suit)),
        allowNull: false,
      },
      value: {
        type: DataTypes.ENUM(...Object.values(enums.card_values)),
        allowNull: false,
      },
      second_value: {
        type: DataTypes.ENUM(...Object.values(enums.card_values)),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Card',
      validate: true,
      hooks: {
        beforeCreate: async (card) => {
          if (!card.id) {
            card.id = await Card.generate_id(card.rank, card.suit);
          }
        },
      },
    }
  );

  return Card;
};
