const get_all_cards = require('../../../src/database/function_seeders/cards'); 
const enums = require('../../../src/enum');
const { models } = require('../../../src/models');


describe('get_all_cards', () => {
  let generate_id
  beforeEach(() => {
    models.Card = {}
    models.Card.generate_id = jest.fn((rank, suit) => `${rank}_${suit}`)
    generate_id = models.Card.generate_id
  })
  it('should generate an array of cards with valid data', () => {
    const result = get_all_cards();

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
    const result = get_all_cards();
    const non_ace_card = result.find((card) => card.rank !== enums.card_rank[1]);
    const ace_card = result.find((card) => card.rank === enums.card_rank[1]);

    expect(non_ace_card).toBeDefined();
    expect(non_ace_card.second_value).toBeNull();
    expect(ace_card.second_value).toBeDefined();
  });

  it('should call the generate_id method for each card', () => {
    get_all_cards();
    expect(generate_id).toHaveBeenCalledTimes(
      Object.keys(enums.card_suit).length * Object.keys(enums.card_rank).length
    );

    for (const suit in enums.card_suit) {
      for (const rank in enums.card_rank) {
        expect(generate_id).toHaveBeenCalledWith(enums.card_rank[rank], enums.card_suit[suit]);
      }
    }
  });
});
