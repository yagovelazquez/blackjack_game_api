const get_all_cards = require('../../../src/database/function_seeders/cards'); 
const enums = require('../../../src/enum')


describe('get_all_cards', () => {
  it('should generate an array of cards with valid data', () => {
    const mockCard = {
      generate_id: jest.fn((rank, suit) => `${rank}_${suit}`),
    };

    const result = get_all_cards(mockCard);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(Object.keys(enums.card_suit).length * Object.keys(enums.card_rank).length);


    result.forEach((card) => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('rank');
      expect(card).toHaveProperty('suit');
      expect(card).toHaveProperty('value');
      expect(card).toHaveProperty('second_value');

      expect(Object.values(enums.card_rank)).toContain(card.rank);
      expect(Object.values(enums.card_suit)).toContain(card.suit);
      expect(Object.values(enums.card_values)).toContain(card.value.toString());
      expect(card.value).toBeGreaterThanOrEqual(1);
      expect(card.value).toBeLessThanOrEqual(11);
    });
  });

  it('should set second value only for ace(1)', () => {
    const mock_card = {
      generate_id: jest.fn((rank, suit) => `${rank}_${suit}`),
    };

    const result = get_all_cards(mock_card);
    const non_ace_card = result.find((card) => card.rank !== enums.card_rank[1]);
    const ace_card = result.find((card) => card.rank === enums.card_rank[1]);

    expect(non_ace_card).toBeDefined();
    expect(non_ace_card.second_value).toBeNull();
    expect(ace_card.second_value).toBeDefined();
  });

  it('should call the generate_id method for each card', () => {
    const mockCard = {
      generate_id: jest.fn(),
    };

    get_all_cards(mockCard);
    expect(mockCard.generate_id).toHaveBeenCalledTimes(
      Object.keys(enums.card_suit).length * Object.keys(enums.card_rank).length
    );

    for (const suit in enums.card_suit) {
      for (const rank in enums.card_rank) {
        expect(mockCard.generate_id).toHaveBeenCalledWith(enums.card_rank[rank], enums.card_suit[suit]);
      }
    }
  });
});
