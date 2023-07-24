const TestHelpers = require('./test_helpers');
const { models } = require('../../src/models');

class BaseModelTester {
    constructor(model_name) {
      this.model_name = model_name;
      this.Model = models[this.model_name];
  
      this.model_config = {
        TableHand: {
          generate_random_data: TestHelpers.generate_random_table_hand,
        },
        User: {
          generate_random_data: TestHelpers.generate_random_user,
        },
        Deck: {
          generate_random_data: TestHelpers.generate_random_deck,
        },
        Game: {
          generate_random_data: TestHelpers.generate_random_game,
        },
        Card: {
          generate_random_data: TestHelpers.generate_random_card,
        },
      };
  
      const model_properties = this.model_config[model_name];
      if (model_properties) {
        Object.assign(this, model_properties);
      }
    }
  }


module.exports = BaseModelTester