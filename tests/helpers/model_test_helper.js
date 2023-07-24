const BaseModelTester = require('./base_model_helper');

class ModelTestHelper extends BaseModelTester {
  constructor(model_name) {
      super(model_name);
  }

  async create(data) {
    const random_data = await this.generate_random_data(data);
    const model_instance = await this.Model.create(random_data);
    return model_instance
  }
}

module.exports = ModelTestHelper;
