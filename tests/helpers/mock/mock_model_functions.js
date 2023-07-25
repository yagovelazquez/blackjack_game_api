const { models } = require("../../../src/models");
const { create_deck, finish_hand, update_deck } = require('./model_functions');

class MockModelFunctions {
  constructor(model_name) {
    this.model_name = model_name;
    this.Model = models[this.model_name];

    this.model_config = {
      Deck: {
        create: create_deck,
      },
      TableHand: {
        finish_hand: finish_hand,
      },
    };

    const model_properties = this.model_config[model_name];
    if (model_properties) {
      Object.assign(this, model_properties);
    }
  }
}

module.exports = MockModelFunctions