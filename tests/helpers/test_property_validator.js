const { models } = require('../../src/models');
const TestHelpers = require('./test_helpers');

class ModelPropertyValidator {
  constructor(model_name) {
    this.model_name = model_name;

    this.modelConfig = {
      User: {
        generate_random_data: TestHelpers.generate_random_user,
      },
      Game: {
        generate_random_data: TestHelpers.generate_random_game,
      },
    };

    const modelProperties = this.modelConfig[model_name];
    if (modelProperties) {
      Object.assign(this, modelProperties);
    }
  }

  async test_property_error({ data, error_message }) {
    const { [this.model_name]: Model } = models;
    const fakeData = await this.generate_random_data({
      ...this.generate_random_data_payload,
      ...data,
    });
    let err;
    let errorObj;

    try {
      await Model.create(fakeData);
    } catch (error) {
      err = error;
      errorObj = error.errors[0];
    }

    expect(err).toBeDefined();
    expect(err.errors.length).toEqual(1);
    expect(errorObj.message).toEqual(error_message);
  }
}

module.exports = ModelPropertyValidator;
