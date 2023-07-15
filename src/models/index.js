const fs = require('fs');
const path = require('path');

let models = {};

function registerModels(sequelize) {
  const thisFile = path.basename(__filename);
  const modelFiles = fs.readdirSync(__dirname);
  const filteredModelFiles = modelFiles.filter((file) => {
    return file !== thisFile && file.slice(-3) === '.js';
  });

  for (const file of filteredModelFiles) {
    const model = require(path.join(__dirname, file))(sequelize);
    models[model.name] = model;
  }

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
}

module.exports = {
  registerModels,
  models,
};