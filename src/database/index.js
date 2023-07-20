const cls = require('cls-hooked');
const Sequelize = require('sequelize');
const { registerModels, models } = require('../models');

class Database {
  constructor(environment, db_config) {
    this.environment = environment;
    this.db_config = db_config;
    this.isTestEnvironment = this.environment === 'test';
  }

  async connect() {
    const namespace = cls.createNamespace('transactions-namespace');
    Sequelize.useCLS(namespace);

    const { username, password, host, port, database, dialect } =
      this.db_config[this.environment];
    this.connection = new Sequelize({
      username,
      password,
      host,
      port,
      database,
      dialect,
      logging: this.isTestEnvironment ? false : console.log,
    });

    await this.connection.authenticate({ logging: false });

    if (!this.isTestEnvironment) {
      console.log(
        'Connection to the database has been established successfully'
      );
    }

    registerModels(this.connection);
    await this.sync();
  }

  async disconnect() {
    await this.connection.close();
  }

  async seed_database({ model_name, seed_data }) {
    try {
      const { [model_name]: Model } = models;
      await Model.bulkCreate(seed_data);
      !this.isTestEnvironment && console.log('Database seeded successfully.');
    } catch (error) {
      !this.isTestEnvironment &&
        console.error('Error seeding the database:', error);
    }
  }

  async sync() {
      await this.connection.sync({
        logging: false,
        force: this.isTestEnvironment,
      });

    if (!this.isTestEnvironment) {
      console.log('Connection synced successfully');
    }
  }
};

module.exports = Database;
