const Database = require("../../src/database");
const db_config = require("../../src/config/database")

describe('Database', () => {
  let database;

  beforeEach(async () => {
    const environment = process.env.NODE_ENV;
    database = new Database(environment, db_config);
    await database.connect()
  });

  afterEach(async () => {
    await database.disconnect();
  });

  describe('connect', () => {
    it('connecting should establish a connection to the database', async () => {
      await expect(database.connect()).resolves.not.toThrow();
      expect(database.connection).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should close the database connection', async () => {
      await database.connect()
      await database.disconnect();
      //TODO FIX THIS await expect(database.connection.authenticate({ logging: false })).rejects.toThrow();

    });
  });

  describe('sync', () => {
    it('should synchronize the models with the database', async () => {
      await database.sync();
      // Add assertions here to check if models are synchronized
    });
  });

});
