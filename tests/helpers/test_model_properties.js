const TestHelpers = require('./test_helpers');
const model_property_validator = require('./test_model_properties');
const { models } = require('../../src/models');
const BaseModelTester = require('./base_model_helper');

class ModelPropertyTester extends BaseModelTester {
  constructor(model_name) {
      super(model_name);
  }

  async test_store_enum_values(enum_values, property, before_interation_cb) {
    Object.values(enum_values).forEach(async (value) => {
      before_interation_cb && (await before_interation_cb());
      await this.test_create_property(value, property);
    });
  }

  async test_create_property(value, property) {
    const random_data = await this.generate_random_data({ [property]: value });
    const model_instance = await this.Model.create(random_data);
    expect(model_instance[property]).toEqual(value);
  }

  async test_property_error({ data, error_message }) {
    const fake_data = await this.generate_random_data({
      ...this.generate_random_data_payload,
      ...data,
    });
    let err;
    let error_obj;

    try {
      await this.Model.create(fake_data);
    } catch (error) {
      err = error;
      error_obj = error.errors[0];
    }
    
    expect(err).toBeDefined();
    expect(err.errors.length).toEqual(1);
    expect(error_obj.message).toEqual(error_message);
  }

  async test_invalid_enum_value(property, value) {
    const random_data = await this.generate_random_data();
    let error;
    try {
      await this.Model.create({ ...random_data, [property]: value });
    } catch (err) {
      error = err.message;
    }
    expect(error).toEqual(`Data truncated for column '${property}' at row 1`);
  }
}

module.exports = ModelPropertyTester;
