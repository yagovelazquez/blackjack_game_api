const { models } = require('../../../src/models');
const enums = require('../../../src/enum');

module.exports = {
  create_deck: (params = {}) => {
    const { Deck } = models;
    const mock_spy_deck = jest.spyOn(Deck, 'create');
    mock_spy_deck.mockResolvedValueOnce({
      save: jest.fn(),
      cards: [
        {
          id: '6h',
        },
        {
          id: '6h',
        },
        {
          id: 'Jh',
        }
      ],
      ...params,
    });
  },
  update_deck: (params = {}) => {
    const { Deck } = models;
    const mock_spy_deck = jest.spyOn(Deck, 'update');
    return mock_spy_deck
  },
  finish_hand: (params = {}) => {
    const { TableHand } = models;
    const mock_spy_table_hand = jest.spyOn(TableHand, 'finish_hand');
    return mock_spy_table_hand
  },
};
