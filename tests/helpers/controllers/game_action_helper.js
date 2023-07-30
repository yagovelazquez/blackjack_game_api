const ControllerHelper = require('./controller_helpper');

class GameActionHelper extends ControllerHelper {
  constructor(controller_params) {
    super(controller_params);
  }

  static test_data_object_is_in_res(res) {
    const { data } = res.body;
    expect(Object.keys(data)).toEqual(['dealer', 'player', 'table_hand_id']);

    expect(Object.keys(data.player)).toEqual(['cards', 'points', 'is_busted']);

    expect(Object.keys(data.dealer)).toEqual(['cards', 'points', 'is_busted']);

    expect(data.winner).not.toBeDefined();

    expect(data.player.points).toBeDefined();
    expect(typeof data.player.points).toBe('number');

    expect(data.dealer.points).toBeDefined();
    expect(typeof data.dealer.points).toBe('number');

    expect(data.dealer.cards.length).toBe(1);
    expect(Object.keys(data.dealer.cards[0])).toEqual([
      'id',
      'rank',
      'suit',
      'value',
      'second_value',
    ]);

    expect(data.player.cards.length).toBe(2);
    expect(Object.keys(data.player.cards[0])).toEqual([
      'id',
      'rank',
      'suit',
      'value',
      'second_value',
    ]);
    expect(Object.keys(data.player.cards[1])).toEqual([
      'id',
      'rank',
      'suit',
      'value',
      'second_value',
    ]);
  }
}

module.exports = GameActionHelper;
